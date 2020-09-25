const ServerEvents = {
  getCurrentTrack: 'getCurrentTrack',
  pauseTrack: 'pauseTrack',
  playTrack: 'playTrack',
  nextTrack: 'nextTrack',
  previousTrack: 'previousTrack',
  autoRefresh: 'autoRefresh'
};

const ClientEvents = {
  currentTrack: 'currentTrack',
};

module.exports = {
  ServerEvents,
  ClientEvents,
}