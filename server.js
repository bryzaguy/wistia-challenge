const express = require('express');
const serveIndex = require('serve-index');

const app = express();
const port = 3000;

app.use(serveIndex('client'));
app.use(express.static('client'));

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});