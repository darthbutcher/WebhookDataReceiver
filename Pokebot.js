// LOAD AND RUN MODULES
const pokebot = require('./modules/base/bot.js');

// PACKAGE REQUIREMENTS
const bodyParser = require('body-parser');
const express = require('express');

// DEFINE THE EXPRESS SERVER
const server = express().use(express.json({ limit: "1mb" }));

// LISTEN TO THE SPECIFIED PORT FOR TRAFFIC
server.listen(pokebot.config.LISTENING_PORT, () => {
  console.info('[Pokébot] [SERVER] Now Listening on port '+pokebot.config.LISTENING_PORT+'.');
});

// CATCH ALL POST REQUESTS
server.post('/', async (webhook, resolve) => {
  return pokebot.webhookParse(webhook.body);
});

module.exports = server;
