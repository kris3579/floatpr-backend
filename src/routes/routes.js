'use strict';

const superagent = require('superagent');
const express = require('express');
const router = express.Router();

const client = require('../client');
client.connect();

const processTournament = require('../processTournament');
// const getActivePlayersFromDatabase = require('../getPlayersFromDatabase');
// const getPlayerFromDatabase = require('../getPlayerFromDatabase');
// const getTournamentsFromDatabase = require('../getTournamentsFromDatabase');
const sendNotificationToDiscord = require('../sendNotificationToDiscord');
// const combineResults = require('../combineResults');
// const updateMains = require('../updateMains');

router.get('/hitChallonge/:tournament', (req, next) => {
  console.log('Recieved request to update the database with a tournament');
  const tournament = req.params.tournament;
  console.log('Querying Challonge for tournament data');
  superagent.get(`https://DigitalSpaceman:${process.env.CHALLONGE_API_KEY}@api.challonge.com/v1/tournaments/${tournament}.json`)
    .then((response) => {
      processTournament(response.body.tournament);
    })
    .catch(next);
});

// router.get('/displayActivePlayers', (res) => {
//   const playerList = getActivePlayersFromDatabase()
//     .then(() => {
//       res.body.players = playerList;
//     })
//     .catch((error) => {
//       throw error;
//     });
// });

// router.get('/displayPlayer/:playerId', (res) => {
//   const player = getPlayerFromDatabase()
//     .then(() => {
//       res.body.player = player;
//     });
// });

// router.get('/displayTournaments', (res) => {
//   const tournamentList = getTournamentsFromDatabase()
//     .then(() =>{
//       res.body.tournaments = tournamentList;
//     });
// });

router.post('/userRequest', (req) => {
  console.log('Recieved request from user to send to Kris at discord');
  console.log(req.body);
  sendNotificationToDiscord(req.body);
});

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