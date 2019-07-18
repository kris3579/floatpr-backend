'use strict';

const smashGG = require('smashgg-promise');

const processTournament = require('../coreFunctions/processTournament');

const getTournamentDataFromSmashGG = (tournament) => {
  console.log('Querying Smash.gg for tournament data');
  smashGG.getTournament(tournament)
    .then((response) => {
      console.log(response.body, 'this');
      // processTournament(response.body.tournament);
    })
    .catch((error) => {
      throw error;
    });
};

module.exports = getTournamentDataFromSmashGG;