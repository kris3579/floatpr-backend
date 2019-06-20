'use strict';

const superagent = require('superagent');
const express = require('express');
const router = express.Router();

const processTournament = require('../processTournament');
// const getPlayersFromDatabase = require('../getPlayersFromDatabase');
// const getTournamentsFromDatabase = require('../getTournamentsFromDatabase');
// const sendNotificationToDiscord = require('../sendNotificationToDiscord');
// const combineResults = require('../combineResults');
// const updateMains = require('../updateMains');

router.get('/hitChallonge/:tournament', (req, next) => {
  const tournament = req.params.tournament;
  superagent.get(`https://DigitalSpaceman:${process.env.CHALLONGE_API_KEY}@api.challonge.com/v1/tournaments/${tournament}.json`)
    .then((response) => {
      processTournament(response.body.tournament);
    })
    .catch(next);
});


// router.get('/displayPlayers', (res) => {
//   const playerList = getPlayersFromDatabase()
//     .then(() => {
//       res.body.players = playerList;
//     })
//     .catch((error) => {
//       throw error;
//     });
// });

// router.get('/displayTournaments', (res) => {
//   const tournamentList = getTournamentsFromDatabase()
//     .then(() =>{
//       res.body.tournaments = tournamentList;
//     });
// });

// router.get('/userRequest', (req) => {
//   sendNotificationToDiscord(req.body);
// });

// router.get('/combineResults/:playerOneName/:playerTwoName', (res, req) => {
//   const playerOneName = req.params.playerOneName;
//   const playerTwoName = req.params.playerTwoName;
//   combineResults(playerOneName, playerTwoName);
// });

// router.get('/updateMains/:playerId', (req) => {
//   const playerId = req.params.playerId;
//   updateMains(playerId, req.body);
// });

router.all('*', (req, res) => {
  console.log('Returning 404 from catch-all route');
  return res.sendStatus(404);
});

module.exports = router;