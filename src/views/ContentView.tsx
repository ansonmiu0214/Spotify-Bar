import React from 'react';

import { Button, CircularProgress, makeStyles } from '@material-ui/core';
import { Alert, AlertTitle } from '@material-ui/lab';

import * as Auth from '../services/Auth';
import { Control } from '../components/ControlBar';
import PlayerView from './PlayerView';

type Props = {
  setControls: (setter: (prev: Control[]) => Control[]) => void,
};

const useStyles = makeStyles({
  root: {
    display: 'flex',
    width: '100vw',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const ContentView: React.FC<Props> = ({ setControls }) => {
  const classes = useStyles();

  const [state, dispatch] = React.useReducer(Auth.reducer, Auth.initialState);

  React.useEffect(
    Auth.createInitialiser(dispatch),
    [dispatch]
  );

  React.useEffect(() => {
    const LogOutControl: Control = {
      name: 'z_logout',
      component: (
        <Button
          variant='contained'
          color='secondary'
          onClick={() => dispatch({ type: 'TryLogOut' })}
        >
          Log Off
        </Button>
      ),
    };

    switch (state.type) {
      case 'LoggedOff':
      case 'Error':
        setControls(prevControls => prevControls.filter(({ name }) => name === 'quit'));
        break;
      case 'LoggedOn':
        setControls(prevControls => ([
          LogOutControl,
          ...prevControls,
        ]));
        break;
    }
  }, [state, setControls]);

  switch (state.type) {
    case 'Uninitialised':
      return (
        <div className={classes.root}> 
          <CircularProgress />
        </div>
      );
    case 'LoggedOff':
      return (
        <div className={classes.root}> 
        <Button
          variant='outlined'
          color='primary'
          onClick={() => dispatch({ type: 'TryLogIn' })}
        >
          Log On
        </Button>
        </div>
      );
    case 'LoggedOn':
      return (
        <PlayerView setControls={setControls} />
      );
    case 'Pending':
      return (
        <div className={classes.root}> 
          <CircularProgress />
        </div>
      );
    case 'PendingAuth':
      return (
        <div className={classes.root} style={{ textAlign: 'center' }}>
          <div>
            <CircularProgress />
          </div>          
          <Alert severity='info'>
            <AlertTitle>Waiting for Authorisation</AlertTitle>
          </Alert>
        </div>
      );
    case 'Error':
      return (
        <div className={classes.root}> 
        <Alert
          severity='error'
          onClose={() => {
            dispatch({
              type: 'TryLogOut',
            });
          }}
        >
          {state.message}
        </Alert>
        </div>
      );
  }
};

export default ContentView;
  