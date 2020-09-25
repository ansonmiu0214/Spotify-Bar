const localConsole = require('../../utils').createConsole('Playback');

const SpotifyWebApi = require('spotify-web-api-node');
const { BrowserWindow } = require('electron');

const IPC = require('../ipc');
const auth = require('../ipc/auth');
const playback = require('../ipc/playback');

class AutoRefresh {

  constructor(
    /** @type {number}        */ timeout,
    /** @type {() => Promise} */ task,
  ) {
    this.timeout = timeout;
    this.task = task;
    this.shouldRefresh = false;
  }

  enable() {
    this.shouldRefresh = true;
    this.refresh(); 
  }

  refresh() {
    const nextRefresh = setTimeout(() => {
      console.log(`Refreshing: ${Date.now()}`);
      this.task().then(() => {
        if (this.shouldRefresh) {
          this.refresh();
        }
      }).catch(error => {
        console.error(`Error in auto refresh: ${error}`);
        this.disable();
      });
    }, this.timeout);

    this.nextRefresh = nextRefresh;
  }

  disable() {
    this.shouldRefresh = false;
  }

}

function handlePlayback(
  /** @type {SpotifyWebApi} */ api,
  /** @type {IPC}           */ ipc,
  /** @type {BrowserWindow} */ window,
) {
  let refreshHandle;

  const getTrack = async () => {
    const { body } = await api.getMyCurrentPlaybackState();
    const { progress_ms, item, is_playing, } = body;

    if (item === undefined) {
      return { result: 'nothing', };
    }

    // Parse song details
    const { album, artists, duration_ms, name, uri, } = item;
    const image = album.images[0];
    const track = {
      name,
      album: {
        name: album.name,
        image,
      },
      artists: artists.map(({ name }) => name),
      isPlaying: is_playing,
      durationMs: duration_ms,
      progressMs: progress_ms,
      uri,
    };

    if (track !== undefined) {
      localConsole.log(`Now playing: ${JSON.stringify(track, null, 4)}`);
    }

    clearTimeout(refreshHandle);
    refreshHandle = setTimeout(() => {
      ipc.server.emit(playback.ServerEvents.getCurrentTrack);
    }, duration_ms - progress_ms);

    return {
      result: 'something',
      track,
    }; 
  };

  const registerEvent = (event, replyEvent, errorEvent, promiseFn) => {
    ipc.server.on(event, (ev, alreadyRefreshed) => {
      promiseFn().then(track => {
        localConsole.info(`Resolved: ${JSON.stringify(track, null, 4)}`);
        ipc.client.send(replyEvent, JSON.stringify(track));
      }).catch(error => {
        localConsole.error(`Error with ${event}: ${error}`);

        if (alreadyRefreshed) {
          ipc.server.emit(auth.ServerEvents.fatalError);
        } else {
          ipc.server.emit(errorEvent, event, ev);
        }
      });
    }); 
  };

  registerEvent(
    playback.ServerEvents.getCurrentTrack,
    playback.ClientEvents.currentTrack,
    auth.ServerEvents.playbackError,
    getTrack,  
  );

  registerEvent(
    playback.ServerEvents.pauseTrack,
    playback.ClientEvents.currentTrack,
    auth.ServerEvents.playbackError,
    () => api.pause().then(getTrack),
  );

  registerEvent(
    playback.ServerEvents.playTrack,
    playback.ClientEvents.currentTrack,
    auth.ServerEvents.playbackError,
    () => api.play().then(getTrack),
  );

  registerEvent(
    playback.ServerEvents.nextTrack,
    playback.ClientEvents.currentTrack,
    auth.ServerEvents.playbackError,
    () => api.skipToNext().then(getTrack),
  );

  registerEvent(
    playback.ServerEvents.previousTrack,
    playback.ClientEvents.currentTrack,
    auth.ServerEvents.playbackError,
    () => api.skipToPrevious().then(getTrack),
  );

  const autoRefresh = new AutoRefresh(1000, () => new Promise((resolve, reject) => {
    getTrack().then(track => {
      ipc.client.send(playback.ClientEvents.currentTrack, JSON.stringify(track));
      resolve();
    }).catch(error => {
      ipc.server.emit(auth.ServerEvents.playbackError);
      reject(error);
    });
  }));

  ipc.server.on(playback.ServerEvents.autoRefresh, (ev, payload) => {
    const { enabled } = JSON.parse(payload);
    const [width, _] = window.getSize();
    if (enabled) {
      autoRefresh.enable();
      window.setSize(
        width,
        296,
        true,
      );
    } else {
      autoRefresh.disable();
      window.setSize(
        width,
        292,
        true,
      );
    }
  })

  localConsole.info('Initialised');
}

module.exports = handlePlayback;