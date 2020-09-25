import React from 'react';

import { CircularProgress, IconButton, List, ListItem, ListItemSecondaryAction, ListItemText, makeStyles, Snackbar } from '@material-ui/core';

import * as History from '../services/History';
import { PlaylistAdd, PlaylistAddCheck, } from '@material-ui/icons';
import { Alert } from '@material-ui/lab';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    width: '100vw',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    width: '100%',
    margin: 'auto',
    height: '170px',
    overflowY: 'scroll',
  }
});

type Props = {
  autoRefresh: boolean,
  syncSignal: boolean,
};

export type SnackbarProps = 
  | { open: false }
  | { open: true, message: string, variant: 'success' | 'error' }
  ;

const HistoryManager: React.FC<Props> = ({ autoRefresh, syncSignal }) => {
  const classes = useStyles();

  const [state, dispatch] = React.useReducer(History.reducer, History.initialState);

  React.useEffect(
    History.createInitialiser(dispatch),
    [dispatch]
  );

  React.useEffect(
    History.onSyncSignal(syncSignal),
    [syncSignal]
  );

  // Snackbar
  const [snackbar, setSnackbar] = React.useState<SnackbarProps>({
    open: false,
  });

  React.useEffect(
    History.createSnackbarListener(setSnackbar),
    [setSnackbar]
  );

  const handleSnackbarClose = (_: React.SyntheticEvent, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setSnackbar({ open: false });
  }

  const Notification = (
    <Snackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      open={snackbar.open}
      autoHideDuration={6000}
      onClose={handleSnackbarClose}
    >
      <Alert severity={snackbar.open ? snackbar.variant : 'info'} onClose={handleSnackbarClose}>
        {snackbar.open && snackbar.message}
      </Alert>
    </Snackbar>
  );

  switch (state.type) {
    case 'uninitialised':
      return (
        <div className={classes.root}>
          {Notification}
          <CircularProgress />
        </div>
      );
    case 'initialised':
      const { tracks } = state;

      return (
        <div className={classes.root}>
        {Notification}
        <List dense className={classes.list}>
          {tracks.map(track => {
            return (
              <ListItem key={track.uri}>
                <ListItemText
                  primary={track.name}
                  secondary={track.artists.join(', ')}
                  />
                <ListItemSecondaryAction>
                  {track.enqueued ? <PlaylistAddCheck />
                  : <IconButton edge='end' onClick={() => {
                    dispatch({
                      type: 'enqueue',
                      track,
                    });
                  }}>
                      <PlaylistAdd />
                    </IconButton>}
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>
        </div>
      );
  }
}

export default HistoryManager;