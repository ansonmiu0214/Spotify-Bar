const localConsole = require('./utils').createConsole('Main');

const {
  app,
  BrowserWindow,
  ipcMain,
  nativeImage,
  Tray,
} = require('electron');

const path = require('path');
const url = require('url');

// Setup paths
const assetsDir = !app.isPackaged
  ? path.join(__dirname, '../assets')
  : path.join(process.resourcesPath, 'assets');
const viewsDir = path.join(__dirname, '../index.html');
const configDir = !app.isPackaged
  ? path.join(__dirname, '../config')
  : path.join(process.resourcesPath, 'config');

// Setup environment variables
const fs = require('fs');
const secrets = JSON.parse(fs.readFileSync(path.join(configDir, 'secret.json')));
Object.entries(secrets).forEach(([key, value]) => {
  process.env[key] = value;
});
localConsole.log('initialised environment');

const IPC = require('./services/ipc');
const { initialiseSpotifyService } = require('./services/spotify');
const { initialiseWebService } = require('./services/web');

// UI elements
/** @type {Electron.BrowserWindow} */
let window; 
/** @type {Electron.Tray} */
let tray;

app.on('ready', () => {
  window = new BrowserWindow({
    width: 400,
    height: 292,
    show: false,
    frame: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  
  window.setVisibleOnAllWorkspaces(true);

  // Initialise services
  const ipc = new IPC(ipcMain, window.webContents);

  ipc.server.on('quit', () => {
    app.quit();
  });

  initialiseWebService(ipc, window);
  initialiseSpotifyService(ipc, window);

  window.loadURL(
    !app.isPackaged
      ? process.env.ELECTRON_START_URL
      : url.format({
          pathname: viewsDir,
          protocol: 'file:',
          slashes: true,
        })
  );

  tray = new Tray(nativeImage.createFromPath(path.join(assetsDir, 'menu_icon.png')));
  tray.on('click', toggleWindow);

  app.dock.hide();
});

const toggleWindow = () => {
  window.isVisible() ? window.hide() : showWindow();
};

const showWindow = () => {
  const trayPos = tray.getBounds();
  const windowPos = window.getBounds();
  let x, y = 0;
  if (process.platform == 'darwin') {
    x = Math.round(trayPos.x + (trayPos.width / 2) - (windowPos.width / 2));
    y = Math.round(trayPos.y + trayPos.height);
  } else {
    x = Math.round(trayPos.x + (trayPos.width / 2) - (windowPos.width / 2));
    y = Math.round(trayPos.y + trayPos.height * 10);
  }

  window.setPosition(x, y, false);
  window.show();

  const children = window.getChildWindows();
  if (children.length === 0) {
    window.focus();
  } else {
    children[0].focus();
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});