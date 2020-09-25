const ServerEvents = {
  clientReady: 'clientReady',
  tryLogIn: 'tryLogIn',
  tryLogOut: 'tryLogOut',
  authCodeReceived: 'authCodeReceived',
  playbackError: 'playbackError',
  fatalError: 'fatalError',
};

const ClientEvents = {
  loggedIn: 'loggedIn',
  loggedOut: 'loggedOut',
  authoriseURL: 'authoriseURL',
  error: 'error',
};

module.exports = {
  ServerEvents,
  ClientEvents,
}