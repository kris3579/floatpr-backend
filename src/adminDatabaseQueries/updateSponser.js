'use strict';

const client = require('../client');

const updateSponser = (playerName, sponser, resolve) => {
  console.log(`Update sponser for player: ${playerName}, sponser: ${sponser}`);

  client.query('UPDATE players SET sponser = $1 WHERE name = $2;', [sponser, playerName])
    .then(() => {
      resolve();
    });
};

module.exports = updateSponser;
