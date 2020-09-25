import React from 'react';

import { Card, CardContent, CardMedia, CircularProgress, IconButton, LinearProgress, makeStyles, Tooltip, Typography, useTheme } from '@material-ui/core';
import { Pause, PlayArrow, SkipNext, SkipPrevious } from '@material-ui/icons';
import { Alert, AlertTitle } from '@material-ui/lab';

import * as Playback from '../services/Playback';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    width: '100%',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '250px',
  },
  content: {
    width: '90%',
    flexGrow: 1,
  },
  cover: {
    marginTop: 'auto',
    marginBottom: 'auto',
    width: '150px',
    height: '150px',
  },
  text: {
    textAlign: 'center',
  },
  controls: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    height: 50,
    width: 50,
  },
  progress: {
    width: '90%',
  },
}));

type Props = {
  autoRefresh: boolean,
  syncSignal: boolean,
};

const MusicPlayer: React.FC<Props> = ({ autoRefresh, syncSignal }) => {
  const classes = useStyles();
  const theme = useTheme();
  const [state, dispatch] = React.useReducer(Playback.reducer, Playback.initialState);

  React.useEffect(
    Playback.createInitialiser(dispatch),
    [dispatch],
  );

  React.useEffect(
    Playback.onSyncSignal(syncSignal),
    [syncSignal]
  );

  switch (state.playing) {
    case 'uninitialised':
      return (
        <div>
          <CircularProgress />
        </div>
      );
    case 'nothing':
      return (
        <Alert severity='warning'>
          <AlertTitle>Nothing Playing</AlertTitle>
          Or you could be in a private session...
        </Alert>
      );
    case 'something':
      const {
        playing,
        state: trackState,
        ...trackDetails
      } = state;
      
      const {
        album,
        image,
        artists,
        name,
        progressMs,
        durationMs,
      } = trackDetails;

      return (
        <Card variant='outlined' className={classes.root}>
          <div className={classes.details}>
            <CardContent className={classes.content}>
              <Tooltip title={name}>
                <Typography className={classes.text} noWrap component='h5' variant='h5'>
                  {name}
                </Typography>
              </Tooltip>
              <Tooltip title={artists.join(', ')}>
                <Typography className={classes.text} noWrap variant='subtitle1' color='textSecondary'>
                  {artists.join(', ')}
                </Typography>
              </Tooltip>
              <Tooltip title={album}>
                <Typography className={classes.text} noWrap variant='subtitle2' color='textSecondary'>
                  {album}
                </Typography>
              </Tooltip>
            </CardContent>
            {autoRefresh && (
              <div className={classes.progress}>
                <LinearProgress
                  variant='determinate'
                  value={(progressMs / durationMs) * 100}
                />
              </div>
            )}
            <div className={classes.controls}>
              <IconButton aria-label='previous'
                onClick={() => dispatch({ type: 'previous', })}
              >
                {theme.direction === 'rtl' ? <SkipNext /> : <SkipPrevious />}
              </IconButton>
              <IconButton aria-label='play/pause'
                onClick={() => {
                  dispatch({
                    type: trackState === Playback.TrackState.Playing ? 'pause' : 'play',
                  });
                }}
              >
                {trackState === Playback.TrackState.Playing
                  ? <Pause className={classes.playIcon} />
                  : <PlayArrow className={classes.playIcon} />
                }
              </IconButton>
              <IconButton aria-label='next'
                onClick={() => dispatch({ type: 'next', })}
              >
                {theme.direction === 'rtl' ? <SkipPrevious /> : <SkipNext />}
              </IconButton>
            </div>
          </div>
          <CardMedia
            className={classes.cover}
            image={image?.url ?? ''}
            title={album}
          />
        </Card>
      );
  }
}

export default MusicPlayer;