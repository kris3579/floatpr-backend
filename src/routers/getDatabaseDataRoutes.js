'use strict';

const express = require('express');

const getDatabaseDataRouter = express.Router();

const getPlayersFromDatabase = require('../databaseQuery/getPlayersFromDatabase');
const getTournamentsFromDatabase = require('../databaseQuery/getTournamentsFromDatabase');
const getSetsFromDatabase = require('../databaseQuery/getSetsFromDatabase');

getDatabaseDataRouter.get('/getPlayers', (req, res) => {
  console.log('Request for players in database');
  getPlayersFromDatabase()
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      throw error;
    });
});

getDatabaseDataRouter.get('/getTournaments', (req, res) => {
  console.log('Request for tournaments in database');
  getTournamentsFromDatabase()
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      throw error;
    });
});

getDatabaseDataRouter.get('/getSets', (req, res) => {
  console.log('Request for sets in database');
  getSetsFromDatabase()
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      throw error;
    });
});

module.exports = getDatabaseDataRouter;