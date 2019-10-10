'use strict';

const client = require('../client');

const storeNewMainsInDatabase = (playerName, mains) => {
  if (mains[0] === 'unknown') {
    mains.shift();
  }

  console.log('Storing player\'s new main in the database');
  client.query('UPDATE players SET mains = $1 WHERE name = $2;', [mains, playerName]);
};

const getCurrentMainsFromDatabase = (playerName, newMains) => {
  console.log('Querying database for old mains');
  client.query('SELECT mains FROM players WHERE name = $1;', [playerName])
    .then((data) => {
      const mains = [...data.rows[0].mains, ...newMains];
      storeNewMainsInDatabase(playerName, mains);
    })
    .catch((error) => {
      throw error;
    });
};

const updateMains = (playerName, mains, doWeDeletePrevious) => {
  console.log(`Updating mains for player: ${playerName}`);

  const doWeDelete = doWeDeletePrevious;
  console.log('Do we delete the previous mains?:', doWeDelete);

  if (doWeDelete === 'false') {
    getCurrentMainsFromDatabase(playerName, mains);
  }
  if (doWeDelete === 'true') {
    storeNewMainsInDatabase(playerName, mains);
  }
};

module.exports = updateMains;
