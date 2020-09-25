import { createMuiTheme, ThemeProvider } from '@material-ui/core';
import React from 'react';
import './App.css';
import ControlBar, { Control } from './components/ControlBar';
import ContentView from './views/ContentView';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#1db954',
    },
    secondary: {
      main: '#000000',
    }
  }
});

function App() {
  const [controls, setControls] = React.useState<Control[]>([]);

  return (
    <ThemeProvider theme={theme}>
      <div className='App'>
        <div className='Nav'>
          <ControlBar controls={controls} />
        </div>
        <div className='Main'>
            <ContentView setControls={setControls} />
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
