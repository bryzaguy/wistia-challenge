const express = require('express');
const serveIndex = require('serve-index');
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
app.use(serveIndex('client'));
app.use(express.static('client'));

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});