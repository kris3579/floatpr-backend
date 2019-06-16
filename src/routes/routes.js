'use strict';

const superagent = require('superagent');
const express = require('express');
const router = express.Router();

// const wipeOldRankingData = require('../wipeOldRankingData');
const processTournament = require('../processTournament');

router.get('/hitChallonge/:tournament', (req, res, next) => {
  const tournament = req.params.tournament;
  superagent.get(`https://DigitalSpaceman:${process.env.CHALLONGE_API_KEY}@api.challonge.com/v1/tournaments/${tournament}.json`)
    .then((response) => {
      // wipeOldRankingData();
      processTournament(response.body.tournament);
      res.json(response.body);
    })
    .catch(next);
});

router.all('*', (req, res) => {
  console.log('Returning 404 from catch-all route');
  return res.sendStatus(404);
});

module.exports = router;