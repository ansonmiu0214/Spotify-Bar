import React from 'react';

import { BottomNavigation, BottomNavigationAction, FormControlLabel, IconButton, makeStyles, Snackbar, Switch } from '@material-ui/core';
import { Album, Battery90, PlaylistPlay, Speed, Sync } from '@material-ui/icons';
import HistoryManager from '../components/HistoryManager';
import MusicPlayer from '../components/MusicPlayer';
import { Control } from '../components/ControlBar';
import { ipcRenderer } from 'electron';
import { Alert } from '@material-ui/lab';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  main: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
});

enum Modes {
  Current,
  Queue,
};

type Props = {
  setControls: (setter: (prevControls: Control[]) => Control[]) => void,
};

type SnackbarProps =
  | { open: false, }
  | { open: true, message: string }
  ;

const PlayerView: React.FC<Props> = ({ setControls }) => {
  const classes = useStyles();

  const [mode, setMode] = React.useState(Modes.Current);
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState<SnackbarProps>({
    open: false,
  });

  const [syncSignal, setSyncSignal] = React.useState(false);

  const handleSnackbarClose = (_: React.SyntheticEvent, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setSnackbar({ open: false });
  }

  React.useEffect(() => {
    const SyncButton: Control = {
      name: 'sync',
      component: (
        <IconButton aria-label='sync' onClick={() => {
          setSyncSignal(true);
          setTimeout(() => setSyncSignal(false), 2000);
        }}>
          <Sync />
        </IconButton>
      ),
    }

    setControls(prevControls => ([
      ...prevControls.filter(({ name }) => name !== 'sync'),
      SyncButton,
    ]));
  }, [setControls]);

  React.useEffect(() => {
    const AutoRefresh: Control = {
      name: 'refresh',
      component: (
        <FormControlLabel
          control={
            <Switch
              size='small'
              checked={autoRefresh}
              onChange={(ev) => {
                ipcRenderer.send('autoRefresh', JSON.stringify({ enabled: ev.target.checked }));
                setAutoRefresh(ev.target.checked);

                setSnackbar({
                  open: true,
                  message: ev.target.checked 
                    ? 'Auto-refresh enabled'
                    : 'Auto-refresh disabled',
                });
              }}
            />
          }
          label={autoRefresh ? 
            <Speed /> : <Battery90 />}
        />
      )
    }

    setControls(prevControls => ([
      AutoRefresh,
      ...prevControls.filter(({ name }) => name !== 'refresh'),
    ]));
  }, [setControls, autoRefresh]);

  return (
    <React.Fragment>
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert severity='info' onClose={handleSnackbarClose}>
          {snackbar.open && snackbar.message}
        </Alert>
      </Snackbar>

      <div className={classes.root}>
        <div className={classes.main}>
          {mode === Modes.Current && <MusicPlayer syncSignal={syncSignal} autoRefresh={autoRefresh} />}
          {mode === Modes.Queue && <HistoryManager syncSignal={syncSignal} autoRefresh={autoRefresh} />}
        </div>
        <div>
          <BottomNavigation
            value={mode}
            onChange={(_, mode) => setMode(mode)}
            showLabels
            style={{
              marginTop: 'auto',
            }}
            >
            <BottomNavigationAction
              label='Playback'
              icon={<Album />}
              />
            <BottomNavigationAction
              label='History'
              icon={<PlaylistPlay />}
              />
          </BottomNavigation>
        </div>
      </div>
    </React.Fragment>

  );
}

export default PlayerView;