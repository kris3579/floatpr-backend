'use strict';

const client = require('../client');

const updateState = (playerName, state, resolve) => {
  console.log(`Updating State for player: ${playerName}`);

  client.query('UPDATE players SET state = $1 WHERE name = $2;', [state, playerName])
    .then(() => {
      resolve();
    });
};

module.exports = updateState;
