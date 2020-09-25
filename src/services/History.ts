import { ipcRenderer } from 'electron';
import React from 'react';
import { SnackbarProps } from '../components/HistoryManager';

interface Details {
  name: string,
  artists: string[],
  uri: string,
  playedAt: string,
};

type Track = Details & {
  enqueued: boolean,
};

type Uninitialised = { type: 'uninitialised' };
type Initialised = { type: 'initialised', tracks: Track[] };

type State = 
  | Uninitialised
  | Initialised;
  ;

export const initialState: State = { type: 'uninitialised' };

type Action =
  | { type: 'setTracks', tracks: Track[] }
  | { type: 'enqueue', track: Track }
  | { type: 'enqueueSuccess', uri: string }
  | { type: 'currentTrack', uri: string }
  ;

export const reducer: React.Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case 'setTracks':
      return {
        type: 'initialised',
        tracks: action.tracks,
      };
    case 'enqueue':
      const { name, uri } = action.track;
      ipcRenderer.send('enqueue', JSON.stringify({
        name, uri
      }));
      return {...state};
    case 'enqueueSuccess': {
      const { tracks } = state as Initialised;
      const filteredTracks = tracks.map(track => {
        if (track.uri === action.uri) {
          return {...track, enqueued: true }
        } else {
          return {...track}
        }
      });
      return {
        type: 'initialised',
        tracks: filteredTracks
      }
    }
    case 'currentTrack': {
      const { tracks } = state as Initialised;
      const filteredTracks = tracks.filter(track => 
        track.uri !== action.uri
      );
      return {
        type: 'initialised',
        tracks: filteredTracks,
      };
    }
  }
};

export const createInitialiser = (dispatch: React.Dispatch<Action>) => () => {
  const handleHistory = (ev: Electron.IpcRendererEvent, payload: any) => {
    const { tracks } = JSON.parse(payload);
    dispatch({
      type: 'setTracks',
      tracks: tracks.map((track: Details) => ({
        ...track,
        enqueued: false,
      })),
    });
  };

  ipcRenderer.on('history', handleHistory);

  const handleResponse = (ev: Electron.IpcRendererEvent, payload: any) => {
    const { success, uri } = JSON.parse(payload);
    if (success) {
      dispatch({
        type: 'enqueueSuccess',
        uri,
      });
    }
  }

  ipcRenderer.on('enqueueResponse', handleResponse);

  ipcRenderer.on('getCurrentTrack', (ev: Electron.IpcRendererEvent, payload: any) => {
    const { uri } = JSON.parse(payload);
    dispatch({
      type: 'currentTrack',
      uri,
    });
  });

  ipcRenderer.send('getHistory');
};

export const onSyncSignal = (syncSignal: boolean) => () => {
  if (syncSignal) {
    ipcRenderer.send('getHistory');
  }
};

export const createSnackbarListener = (setSnackbar: React.Dispatch<React.SetStateAction<SnackbarProps>>) => () => {
  ipcRenderer.on('enqueueResponse', (ev, payload) => {
    const { success, name } = JSON.parse(payload);
    if (success) {
      setSnackbar({
        open: true,
        message: `Successfully enqueued ${name}`,
        variant: 'success',
      });
    } else {
      setSnackbar({
        open: true,
        message: `We could not enqueue ${name}`,
        variant: 'error',
      });
    }
  });
};