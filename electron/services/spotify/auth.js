const localConsole = require('../../utils').createConsole('Auth');

const { BrowserWindow, ipcMain } = require('electron');
const SpotifyWebApi = require('spotify-web-api-node');
const IPC = require('../ipc');
const auth = require('../ipc/auth');

// Constants
const scopes = [
  'user-read-playback-state',
  'user-read-currently-playing',
  'user-read-recently-played',
  'user-modify-playback-state',
];
const state = process.env.STATE;
const keys = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  expiresIn: 'expires_in',
};

// Data storage
const Store = require('electron-store');
const authStore = new Store();

let refreshHandle;

function handleAuthentication(
  /** @type {SpotifyWebApi} */ api,
  /** @type {IPC}           */ ipc,
  /** @type {BrowserWindow} */ window,
) {
  ipc.server.on(auth.ServerEvents.clientReady, (ev) => {
    ev.reply(
      loadTokensFromStore(api, ipc)
      ? auth.ClientEvents.loggedIn
      : auth.ClientEvents.loggedOut
    );
  });

  ipc.server.on(auth.ServerEvents.tryLogIn, (ev) => {
    if (loadTokensFromStore(api, ipc)) {
      ev.reply(auth.ClientEvents.loggedIn);
      return;
    }

    // Create child window to show authorise URL
    const authoriseURL = api.createAuthorizeURL(scopes, state);
    const child = new BrowserWindow({
      width: 600,
      height: 800,
      show: false,
      resizable: false,
      parent: window,
    });
    child.loadURL(authoriseURL);
    child.on('ready-to-show', () => {
      child.show();
      child.focus();
    });

    ev.reply(auth.ClientEvents.authoriseURL, JSON.stringify({ authoriseURL }));
  });

  ipc.server.on(auth.ServerEvents.tryLogOut, (ev) => {
    clearTokens(api);
    ev.reply(auth.ClientEvents.loggedOut);
  });

  ipc.server.on(auth.ServerEvents.authCodeReceived, (payload) => {
    const { code } = JSON.parse(payload);
    localConsole.info(`Received code: ${code}`);

    api.authorizationCodeGrant(code)
      .then(({ body }) => {

        const accessToken = body.access_token;
        const refreshToken = body.refresh_token;
        const expiresIn = body.expires_in;

        setAccessToken(api, accessToken);
        setRefreshToken(api, refreshToken);
        setExpiresIn(ipc, { seconds: expiresIn });

        ipc.client.send(auth.ClientEvents.loggedIn);
      })
      .catch(error => {
        localConsole.error(`Error at AuthCodeGrant: ${error}`);
        ipc.client.send(auth.ClientEvents.error, JSON.stringify({
          message: 'Please log in again',
        }));
      });
  });

  ipc.server.on(auth.ServerEvents.playbackError, (failedEvent, ev) => {
    localConsole.info(`Failed event: ${failedEvent}`);
    api.refreshAccessToken()
      .then(({ body }) => {
        localConsole.info('Access token refreshed');

        const accessToken = body[keys.accessToken];
        setAccessToken(api, accessToken);

        const seconds = body.expires_in
        const nowInMillis = Date.now();
        const deltaInMillis = seconds * 1000;
        const expiryInMillis = nowInMillis + deltaInMillis;
        setExpiresIn(ipc, expiryInMillis);

        if (failedEvent !== undefined) {
          ipc.server.emit(failedEvent, ev, true);
        }
      })
      .catch(error => {
        localConsole.error(error);
        ipc.client.send(auth.ClientEvents.error, JSON.stringify({
          message: 'Please log in again',
        }));
      });
  });

  ipc.server.on(auth.ServerEvents.fatalError, () => {
    ipc.client.send(auth.ClientEvents.error, JSON.stringify({
      message: 'Please log in again',
    }));
  });

  localConsole.info('Initialised');
}

function loadTokensFromStore(
  /** @type {SpotifyWebApi} */ api,
  /** @type {IPC}           */ ipc,
) {
  const accessToken = authStore.get(keys.accessToken);
  const refreshToken = authStore.get(keys.refreshToken);
  const expiresIn = authStore.get(keys.expiresIn);

  if (accessToken === undefined || refreshToken === undefined || expiresIn === undefined) {
    localConsole.info('No credentials in store');
    return false;
  }

  localConsole.info('Credentials in store');

  setAccessToken(api, accessToken);
  setRefreshToken(api, refreshToken);
  setExpiresIn(ipc, expiresIn);

  return true;
}

function setAccessToken(
  /** @type {SpotifyWebApi} */ api,
  /** @type {string}        */ token,
) {
  api.setAccessToken(token);

  authStore.set(keys.accessToken, token);
}

function setRefreshToken(
  /** @type {SpotifyWebApi} */ api,
  /** @type {string}        */ token,
) {
  api.setRefreshToken(token);

  authStore.set(keys.refreshToken, token);
}

function setExpiresIn(
  /** @type {IPC}    */ ipc,
  /** @type {number} */ expiryInMillis,
) { 
  const nowInMillis = Date.now();
  authStore.set(keys.expiresIn, expiryInMillis);

  const deltaInMillis = Math.max(expiryInMillis - nowInMillis, 0);
  localConsole.info(`Access token expires in (${deltaInMillis}): ${new Date(expiryInMillis).toUTCString()}`);
  clearTimeout(refreshHandle);

  refreshHandle = setTimeout(() => {
    ipc.server.emit(auth.ServerEvents.playbackError);
  }, deltaInMillis + 1);
}

function clearTokens(
  /** @type {SpotifyWebApi} */ api,
) {
  authStore.delete(keys.accessToken);
  authStore.delete(keys.refreshToken);
  authStore.delete(keys.expiresIn);
}

module.exports = handleAuthentication;