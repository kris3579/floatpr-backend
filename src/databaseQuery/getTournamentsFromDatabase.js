'use strict';

const client = require('../client');

const getTournamentsFromDatabase = () => {
  const tournamentList = [];

  return queryDatabase()
    .then((data) => {
      data.rows.forEach((row) => {
        tournamentList.push(row);
      });

      return tournamentList;
    });
};

const queryDatabase = () => {
  return client.query('SELECT * FROM tournaments ORDER BY date DESC;')
    .then((data) => {
      return data;
    })
    .catch((error) => {
      throw error;
    });
};

module.exports = getTournamentsFromDatabase;