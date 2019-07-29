'use strict';

const express = require('express');
const handleRequestRouter = express.Router();

// const sendNotificationToDiscord = require('../coreFunctions/sendNotificationToDiscord');
const combineResults = require('../adminDatabaseQueries/combineResults');
const updateMains = require('../adminDatabaseQueries/updateMains');
const updateState = require('../adminDatabaseQueries/updateState');

// handleRequestRouter.post('/userRequest', (req) => {
//   console.log('Recieved request from user to send to Kris at discord');
//   console.log(req.body);
//   sendNotificationToDiscord(req.body);
// });

handleRequestRouter.post('/combineResults', (req) => {
  const playerOneName = req.body.playerOneName;
  const playerTwoName = req.body.playerTwoName;
  combineResults(playerOneName, playerTwoName);
});

handleRequestRouter.post('/updateMains', (req) => {
  const playerName = req.body.playerName;
  const mains = req.body.mains.split(' ');
  const doWeDeletePrevious = req.body.doWeDeletePrevious;
  updateMains(playerName, mains, doWeDeletePrevious);
});

handleRequestRouter.post('/updateState', (req) => {
  const playerName = req.body.playerName;
  const state = req.body.state;
  updateState(playerName, state);
});

module.exports = handleRequestRouter;