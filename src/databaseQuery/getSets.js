'use strict';

const client = require('../client');

const queryDatabase = () => {
  return client.query('SELECT * FROM sets ORDER BY date DESC;')
    .then((data) => {
      return data;
    })
    .catch((error) => {
      throw error;
    });
};

const getSetsFromDatabase = () => {
  const setsList = [];

  return queryDatabase()
    .then((data) => {
      data.rows.forEach((row) => {
        setsList.push(row);
      });

      return setsList;
    });
};

module.exports = getSetsFromDatabase;
