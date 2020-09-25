import { ipcRenderer } from 'electron';
import React from 'react';

interface TrackDetail {
  name: string,
  artists: string[],
  album: string,
  image: {
    url: string,
    height: number,
    width: number,
  },
  durationMs: number,
  progressMs: number,
};

export enum TrackState {
  Playing,
  Pause,
};

type Uninitialised = { playing: 'uninitialised', };
type NothingPlaying = { playing: 'nothing', };
type SomethingPlaying = { playing: 'something', state: TrackState, } & TrackDetail;
type State = Uninitialised | NothingPlaying | SomethingPlaying;

export const initialState: State = { playing: 'uninitialised', };

type Action = 
  | { type: 'nothing' }
  | ({ type: 'setTrack' } & TrackDetail & { state: TrackState})
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'next' }
  | { type: 'previous' }
  ;

export const reducer: React.Reducer<State, Action> = (state, action) => {

  switch (action.type) {
    case 'nothing':
      return {
        playing: 'nothing',
      };

    case 'setTrack': {
      const { type, ...rest } = action;
      return {
        playing: 'something',
        ...rest,
      };
    }

    case 'play': {
      ipcRenderer.send('playTrack');
      return {
        ...(state as SomethingPlaying),
        state: TrackState.Playing,
      };
    }

    case 'pause': {
      ipcRenderer.send('pauseTrack');
      return {
        ...(state as SomethingPlaying),
        state: TrackState.Pause,
      };
    }

    case 'previous': {
      ipcRenderer.send('previousTrack');
      return state;
    }

    case 'next': {
      ipcRenderer.send('nextTrack');
      return state;
    }
  }
};

export const onSyncSignal = (syncSignal: boolean) => () => {
  if (syncSignal) {
    ipcRenderer.send('getCurrentTrack');
  }
};

export const createInitialiser = (dispatch: React.Dispatch<Action>) => () => {
  ipcRenderer.send('getCurrentTrack');

  const handleCurrentTrack = (_: Electron.IpcRendererEvent, payload: any) => {
    const { result, track } = JSON.parse(payload);
    if (result === 'nothing') {
      dispatch({
        type: 'nothing',
      });
    } else {
      const { name, album, artists, isPlaying, progressMs, durationMs, } = track;
      dispatch({
        type: 'setTrack',
        name,
        artists,
        album: album.name,
        image: album.image,
        state: isPlaying ? TrackState.Playing : TrackState.Pause,
        progressMs,
        durationMs,
      });
    }
  }
  
  ipcRenderer.on('currentTrack', handleCurrentTrack);
};