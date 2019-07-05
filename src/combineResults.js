'use strict';

const client = require('./client');
const recalculatePlayerStatistics = require('./recalculatePlayerStatistics');

const combineResults = (playerOneName, playerTwoName) => {
  client.query(`UPDATE matches SET winnerName = ${playerOneName} WHERE winnerName = ${playerTwoName};`);
  client.query(`UPDATE matches SET loserName = ${playerOneName} WHERE loserName = ${playerTwoName};`);

  client.query(`DELETE FROM players WHERE name = ${playerTwoName};`);

  recalculatePlayerStatistics();
};

module.exports = combineResults;