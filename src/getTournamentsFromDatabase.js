'use strict';

const client = require('./client');

client.connect();

const getTournamentFromDatabase = () => {
  console.log('Querying database for list of tournaments');
  client.query('SELECT * FROM tournaments;')
    .then((data) => {
      const tournamentList = [];
      data.rowCount.forEach((row) => {
        tournamentList.push(row);
      });
      orderListByDate(tournamentList);
      return tournamentList;
    })
    .catch((error) => {
      throw error;
    });
};

const orderListByDate = (tournamentList) => {
  tournamentList.sort(function(a, b){
    return new Date(b.date) - new Date(a.date);
  });
};

module.exports = getTournamentFromDatabase;