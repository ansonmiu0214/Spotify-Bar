const localConsole = require('../../utils').createConsole('Queue');

const SpotifyWebApi = require('spotify-web-api-node');
const WebApiRequestBuilder = require('spotify-web-api-node/src/webapi-request');
const HttpManager = require('spotify-web-api-node/src/http-manager');

const { BrowserWindow } = require('electron');

const IPC = require('../ipc');
const auth = require('../ipc/auth');
const queue = require('../ipc/queue');

function handleQueue(
  /** @type {SpotifyWebApi} */ api,
  /** @type {IPC}           */ ipc,
  /** @type {BrowserWindow} */ window,
) {

  ipc.server.on(queue.ServerEvents.enqueue, (ev, payload) => {
    const { name, uri } = JSON.parse(payload);
    const action = WebApiRequestBuilder.builder(api.getAccessToken())
      .withPath('/v1/me/player/queue')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withQueryParameters({
        uri,
      })
      .build()
      .execute(HttpManager.post);

    action.then(() => {
      localConsole.log(`Enqueued ${uri}`);
      ev.reply(queue.ClientEvents.enqueueResponse, JSON.stringify({
        success: true,
        name,
        uri,
      }));
    }).catch(error => {
      console.error(`Error: ${error}`);
      ev.reply(queue.ClientEvents.enqueueResponse, JSON.stringify({
        success: false,
        name,
        uri,
      }));
    })
  });

  localConsole.info('Initialised');
}

module.exports = handleQueue;