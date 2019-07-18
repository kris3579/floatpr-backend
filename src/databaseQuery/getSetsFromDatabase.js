'use strict';

const client = require('../client');

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

const queryDatabase = () => {
  return client.query('SELECT * FROM sets ORDER BY date DESC;')
    .then((data) => {
      return data;
    })
    .catch((error) => {
      throw error;
    });
};

module.exports = getSetsFromDatabase;