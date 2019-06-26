'use strict';

const client = require('./client');

// client.connect();

const getPlayerFromDatabase = (playerId) => {
  console.log('Querying database for a player using an id');
  client.query(`SELECT * FROM players WHERE id = ${playerId}`)
    .then((data) => {
      const player = data;
      return player;
    })
    .catch((error) => {
      throw error;
    });
};

module.exports = getPlayerFromDatabase;