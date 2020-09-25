const { BrowserWindow } = require('electron');
const SpotifyWebApi = require('spotify-web-api-node');
const IPC = require('../ipc');

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;

const handlers = [
  require('./auth'),
  require('./playback'),
  require('./history'),
  require('./queue'),
];

function initialiseSpotifyService(
  /** @type {IPC}           */ ipc,
  /** @type {BrowserWindow} */ window
) {
  const api = new SpotifyWebApi({
    clientId,
    clientSecret,
    redirectUri,
  });

  // Register handlers
  handlers.forEach(handler => {
    handler(api, ipc, window);
  });
}

module.exports = {
  initialiseSpotifyService,
}