'use strict';

const client = require('../client');

const updateMains = (playerName, mains, resolve) => {
  console.log(`Updating mains for player: ${playerName}, mains: ${mains}`);
  
  client.query('UPDATE players SET mains = $1 WHERE name = $2;', [mains, playerName])
    .then(() => {
      resolve();
    });
};

module.exports = updateMains;
