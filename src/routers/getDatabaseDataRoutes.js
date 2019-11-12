'use strict';

const express = require('express');

const getDatabaseDataRouter = express.Router();

const getPlayers = require('../databaseQueries/getPlayers');
const getSets = require('../databaseQueries/getSets');
const getTournaments = require('../databaseQueries/getTournaments');
const getIndividualHead2Head = require('../databaseQueries/getIndividualHead2Head');
const getPairHead2Head = require('../databaseQueries/getPairHead2Head');
const getTopPlayerHead2Head = require('../databaseQueries/getTopPlayerHead2Head');

getDatabaseDataRouter.get('/getPlayers', (req, res) => {
  console.log('Request for players in database');
  getPlayers()
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      throw error;
    });
});

getDatabaseDataRouter.get('/getSets', (req, res) => {
  console.log('Request for sets in database');
  getSets()
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      throw error;
    });
});

getDatabaseDataRouter.get('/getTournaments', (req, res) => {
  console.log('Request for tournaments in database');
  getTournaments()
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      throw error;
    });
});

getDatabaseDataRouter.get('/getIndividualHead2Head/:player', (req, res) => {
  console.log('Request for head2head for a single player');
  const { player } = req.params;
  getIndividualHead2Head(player)
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      throw error;
    });
});

getDatabaseDataRouter.get('/getPairHead2Head/:player1/:player2', (req, res) => {
  console.log('Request for head2head between two players');
  const { player1 } = req.params;
  const { player2 } = req.params;
  getPairHead2Head(player1, player2)
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      throw error;
    });
});

getDatabaseDataRouter.get('/getTopPlayerHead2Head', (req, res) => {
  console.log('Request for the top player head2head data');
  getTopPlayerHead2Head()
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      throw error;
    });
});

module.exports = getDatabaseDataRouter;
