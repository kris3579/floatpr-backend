'use strict';

const client = require('./client');

// client.connect();

const getActivePlayersFromDatabase = () => {
  console.log('Querying database for list of players');
  client.query('SELECT * FROM players;')
    .then((data) => {
      const playerList = [];
      data.rowCount.forEach((row) => {
        playerList.push(row);
      });
      filterInactivePlayers(playerList);
      orderListByRating(playerList);
      return playerList;
    })
    .catch((error) => {
      throw error;
    });
};

const filterInactivePlayers = (playerList) => {
  console.log('Filtering out inactive players');
  playerList.filter();
};

const orderListByRating = (playerList) => {
  console.log('Sorting list by rating');
  playerList.sort(function(a, b){
    return a.rating - b.rating;
  });
};

module.exports = getActivePlayersFromDatabase;