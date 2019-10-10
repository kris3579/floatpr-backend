'use strict';

const client = require('../client');
const recalculatePlayerStatistics = require('../coreFunctions/recalculatePlayerStatistics');
  
const callRecalculate = () => {
  console.log('Recalculating players statistics');
  recalculatePlayerStatistics();
};
  
const deleteMergingPlayer = (playerTwoName) => {
  return client.query('DELETE FROM players WHERE name = $1;', [playerTwoName])
    .catch((error) => {
      throw error;
    });
};
  
  
const updateLoserNameInSets = (playerOneName, playerTwoName) => {
  return client.query('UPDATE sets SET loser_name = $1 WHERE loser_name = $2;', [playerOneName, playerTwoName])
    .catch((error) => {
      throw error;
    });
};
  
const updateWinnerNameInSets = (playerOneName, playerTwoName) => {
  return client.query('UPDATE sets SET winner_name = $1 WHERE winner_name = $2;', [playerOneName, playerTwoName])
    .catch((error) => {
      throw error;
    });
};

const combineResults = (playerOneName, playerTwoName) => {
  console.log(`Merging results of ${playerTwoName} into ${playerOneName}`);
  updateWinnerNameInSets(playerOneName, playerTwoName)
    .then(() => {
      updateLoserNameInSets(playerOneName, playerTwoName)
        .then(() => {
          deleteMergingPlayer(playerTwoName)
            .then(() => {
              callRecalculate();
            })
            .catch((error) => {
              throw error;
            });
        })
        .catch((error) => {
          throw error;
        });
    })
    .catch((error) => {
      throw error;
    });
};

module.exports = combineResults;
