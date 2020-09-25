# Spotify Bar
A simple Spotify remote on your menu bar.

> __Personal disclaimer:__
>
> _This is a throwaway project 
> for me to get to know Electron._

## For Users

![Player](images/spotify_bar_1.png)
![Player](images/spotify_bar_2.png)
![Player](images/spotify_bar_3.png)

### Features
- ✅ Controls - play, pause, previous track, next track
- ✅ Show album artwork
- ✅ See and enqueue songs from history
- ✅ Toggle to show song timeline, or hide and sync less frequently (to save battery)
- ✅ Accessible from any desktop/workspace

### Downloads

TODO...

## For Developers

### How it works
- Uses the Spotify Web API (via the wrapper by [`thelinmichael/spotify-web-api-node`](https://github.com/thelinmichael/spotify-web-api-node)), requires user authentication
- Electron app manages the Spotify API on the Node instance and renders the React + Material-UI frontend
- Frontend communicates with Spotify API via Electron IPC (using `ipcMain` and `ipcRenderer`)

### Getting Started

1. Install all Node dependencies.

2. Create a Spotify developer account, followed by
a Spotify app on [https://developer.spotify.com/dashboard/](https://developer.spotify.com/dashboard/).

3. In the local project directory, inside `config/secret.json`, fill in `CLIENT_ID` and `CLIENT_SECRET` according to the Spotify dashboard for your newly created app in step 2.

3. Open two terminal windows to run both the React
development server and the Electron app.

To run the app in development mode, run
`npm start` and `npm run start-electron` in separate terminal instances.

> For Windows users,
> run `npm run package-win`.

### Packaging

To package the app, run `npm run package`.

The executable will be under `dist/`.

> For Windows users,
> run `npm run package-win`.