const localConsole = require('../../utils').createConsole('History');

const SpotifyWebApi = require('spotify-web-api-node');
const { BrowserWindow } = require('electron');

const IPC = require('../ipc');
const auth = require('../ipc/auth');
const playback = require('../ipc/playback');
const history = require('../ipc/history');

function handleHistory(
  /** @type {SpotifyWebApi} */ api,
  /** @type {IPC}           */ ipc,
  /** @type {BrowserWindow} */ window,
) {
  const recentlyPlayed = () => new Promise((resolve, reject) => {
    api.getMyRecentlyPlayedTracks()
      .then(({ body }) => {
        const { items } = body;
        const tracks = items
          .map(({ track, played_at }) => {
            const {
              name,
              artists,
              uri,
            } = track;
            return {
              name,
              uri,
              playedAt: played_at,
              artists: artists.map(({ name }) => name),
            };
          })
          .sort(({ playedAt: first }, { playedAt:second  }) => 
            first.localeCompare(second)  
          )
          .reverse();

        const uniqueTracks = new Set();
        resolve({
          tracks: tracks.map(track => {
            if (uniqueTracks.has(track.uri)) {
              return undefined;
            }

            uniqueTracks.add(track.uri);
            return track;
          }).filter(track => track !== undefined)
        });
      })
      .catch(reject);
  });

  ipc.server.on(history.ServerEvents.getHistory, (ev, alreadyRefreshed) => {
    recentlyPlayed()
      .then(result => {
        localConsole.log(`Resolved: ${JSON.stringify(result, null, 4)}`)
        ev.reply(history.ClientEvents.history, JSON.stringify(result));
      })
      .catch(error => {
        localConsole.error(`Error at getHistory: ${error}`);
        if (alreadyRefreshed) {
          ipc.server.emit(auth.ServerEvents.fatalError);
        } else {
          ipc.server.emit(auth.ServerEvents.playbackError, history.ServerEvents.getHistory, ev);
        }
      })
  });

  localConsole.info('Initialised');
}

module.exports = handleHistory;