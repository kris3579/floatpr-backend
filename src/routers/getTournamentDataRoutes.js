'use strict';

const express = require('express');

const getTournamentDataRouter = express.Router();

const getTournamentDataFromChallonge = require('../APIQueries/getTournamentDataFromChallonge');
const getTournamentDataFromSmashGG = require('../APIQueries/getTournamentDataFromSmashGG');

getTournamentDataRouter.get('/hitChallonge/:tournament', (req) => {
  console.log('Recieved request to update the database with a tournament from Challonge');
  const { tournament } = req.params;

  getTournamentDataFromChallonge(tournament);
});

getTournamentDataRouter.get('/hitSmashGG/:tournament/:event', (req) => {
  console.log('Recieved request to update the database with a tournament from Smash.gg');
  const { tournament, event } = req.params;
  
  getTournamentDataFromSmashGG(tournament, event);
});

module.exports = getTournamentDataRouter;
