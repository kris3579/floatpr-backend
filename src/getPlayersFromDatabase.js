'use strict';

const client = require('./client');

client.connect();

const getPlayersFromDatabase = () => {
  console.log('Querying database for list of players');
  client.query('SELECT * FROM players;')
    .then((data) => {
      const playerList = [];
      data.rowCount.forEach((row) => {
        playerList.push(row);
      });
      orderListByRating(playerList);
    })
    .catch((error) => {
      throw error;
    });
};

const orderListByRating = (playerList) => {
  playerList.sort(function(a, b){
    return a.rating - b.rating;
  });
};

module.exports = getPlayersFromDatabase;