import React from 'react';

import { AppBar, IconButton, makeStyles, Toolbar, Typography } from '@material-ui/core';
import { Cancel } from '@material-ui/icons';
import { ipcRenderer } from 'electron';

export interface Control {
  name: string;
  component: JSX.Element;
};

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
  },
  title: {
    flexGrow: 1,
  },
}));

type Props = {
  controls: Control[],
};

const ControlBar: React.FC<Props> = ({ controls }) => {
  const classes = useStyles();
  
  return (
    <div className={classes.root}>
      <AppBar position='sticky'>
        <Toolbar>
          <IconButton aria-label='quit' onClick={() => ipcRenderer.send('quit')}>
            <Cancel />
          </IconButton>
          <Typography className={classes.title}>
  
          </Typography>
          {controls
            .sort(({ name: first }, { name: second }) => first.localeCompare(second))
            .map(({ name,  component }) => 
              <React.Fragment key={name}>
                {component}
              </React.Fragment>
            )}
        </Toolbar>
      </AppBar>
    </div>
  );
}

export default ControlBar;