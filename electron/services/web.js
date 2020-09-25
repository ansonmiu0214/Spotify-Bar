const localConsole = require('../utils').createConsole('Web');

const { BrowserWindow } = require('electron');
const express = require('express');

const IPC = require('./ipc');
const auth = require('./ipc/auth');

const PORT = process.env.WEB_PORT || 8080;

function initialiseWebService(
  /** @type {IPC}           */ ipc,
  /** @type {BrowserWindow} */ window
) {
  const app = express();

  app.get(`/${process.env.REDIRECT_ENDPOINT}`, (req, res) => {
    // Parse authorisation code from Spotify
    const { code } = req.query;
    localConsole.info(`Received code: ${code}`);

    // Tell Spotify to proceed
    ipc.server.emit(auth.ServerEvents.authCodeReceived, JSON.stringify({ code }));

    // TODO: render something more meaningful
    res.send('OK - you may close this window.');
  });

  app.listen(PORT, () => {
    localConsole.log(`Listening on port ${PORT}...`);
  });
}

module.exports = {
  initialiseWebService,
}