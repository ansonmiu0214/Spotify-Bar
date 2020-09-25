import React from 'react';
import { ipcRenderer } from 'electron';

export type State =
  | { type: 'Uninitialised', }
  | { type: 'LoggedOff', }
  | { type: 'Pending', }
  | { type: 'PendingAuth', authoriseURL: string, }
  | { type: 'LoggedOn', }
  | { type: 'Error', message: string, }
  ;

export const initialState: State = { type: 'Uninitialised' };

export type Action =
  | { type: 'TryLogOut', }
  | { type: 'SetLogOut', }
  | { type: 'TryLogIn', }
  | { type: 'SetLogIn', }
  | { type: 'AskForAuth', authoriseURL: string, }
  | { type: 'ShowError', message: string, }
  ;

type Reducer = React.Reducer<State, Action>;

export const createInitialiser = (dispatch: React.Dispatch<Action>) => () => {
  ipcRenderer.send('clientReady');

  ipcRenderer.on('loggedOut', () => {
    dispatch({
      type: 'SetLogOut',
    });
  });

  ipcRenderer.on('loggedIn', () => {
    dispatch({
      type: 'SetLogIn',
    });
  });

  ipcRenderer.on('error', (_, payload) => {
    const { message } = JSON.parse(payload);
    dispatch({
      type: 'ShowError',
      message,
    })
  });

  ipcRenderer.on('authoriseURL', (_, payload) => {
    const { authoriseURL } = JSON.parse(payload);
    dispatch({
      type: 'AskForAuth',
      authoriseURL,
    });
  });
};

export const reducer: Reducer = (state, action) => {
  switch (action.type) {
    case 'SetLogIn':
      return {
        type: 'LoggedOn',
      };
    case 'SetLogOut':
      return {
        type: 'LoggedOff',
      };
    case 'TryLogIn':
      ipcRenderer.send('tryLogIn');
      return {
        type: 'Pending',
      };

    case 'AskForAuth':
      const authoriseURL = action.authoriseURL;
      return {
        type: 'PendingAuth',
        authoriseURL,
      }
    case 'TryLogOut':
      ipcRenderer.send('tryLogOut');
      return { type: 'Pending' };

    case 'ShowError':
      const { message } = action;
      return { type: 'Error', message, };
  }
}