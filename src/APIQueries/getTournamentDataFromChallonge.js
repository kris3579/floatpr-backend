'use strict';

const superagent = require('superagent');

const processTournament = require('../coreFunctions/processTournament');

const getTournamentDataFromChallonge = (tournament) => {
  console.log('Querying Challonge for tournament data');
  superagent.get(`https://DigitalSpaceman:${process.env.CHALLONGE_API_KEY}@api.challonge.com/v1/tournaments/${tournament}.json`)
    .query('include_participants=1&include_matches=1')
    .then((response) => {
      processTournament(response.body.tournament);
    })
    .catch((error) => {
      throw error;
    });
};

module.exports = getTournamentDataFromChallonge;