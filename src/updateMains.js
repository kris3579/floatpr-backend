'use strict';

const client = require('./client');

const updateMains = (playerId, requestBody) => {
  console.log('Updating mains for player');
  const newMains = [];
  newMains.push(requestBody.mains);

  const doWeDeletePrevious = requestBody.doWeDeletePrevious;
  console.log('Do we delete the previous mains?:', doWeDeletePrevious);

  if (doWeDeletePrevious === false) {
    getCurrentMainsFromDatabase(playerId, newMains);
  }
  if (doWeDeletePrevious === true) {
    storeNewMainsInDatabase(playerId, newMains);
  }
};

const getCurrentMainsFromDatabase = (playerId, newMains) => {
  console.log('Querying database for old mains');
  client.query(`SELECT mains FROM players WHERE id = ${playerId};`)
    .then((data) => {
      console.log(data);
      const mains = [...data.mains, ...newMains];
      storeNewMainsInDatabase(playerId, mains);
    })
    .catch((error) => {
      throw error;
    });
};

const storeNewMainsInDatabase = (playerId, newMains) => {
  const unknownIndex = newMains.indexOf('unknown');

  if (unknownIndex !== -1) {
    // Method other than pop?
    newMains.pop(unknownIndex);
  }

  console.log('Storing player\'s new main in the database');
  client.query(`UPDATE players SET mains = ${newMains} WHERE id = ${playerId};`);
};

module.exports = updateMains;