const { EventEmitter } = require('events');

class IPC {

  constructor(/** @type {EventEmitter} */ server,
              /** @type {EventEmitter} */ client) {
    this.server = server;
    this.client = client;
  }

}

module.exports = IPC;