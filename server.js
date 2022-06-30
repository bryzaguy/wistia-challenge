const express = require('express');
const livereload = require("livereload");
const connectLiveReload = require("connect-livereload");

const liveReloadServer = livereload.createServer();
liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});

const app = express();
const port = 3000;

app.use(connectLiveReload());
app.use(express.static('client'));
app.use(express.json())

const hiddenMedia = {};

app.get('/hidden-medias', (req, res) => {
  res.json(hiddenMedia);
});

app.put('/hidden-medias/:hashId', (req, res) => {
  hiddenMedia[req.params.hashId] = (req.body || {}).hidden;
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});