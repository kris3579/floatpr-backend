'use strict';

const express = require('express');

const updatePlayerRouter = express.Router();

const combineResults = require('../adminDatabaseQueries/combineResults');
const updateMains = require('../adminDatabaseQueries/updateMains');
const updateState = require('../adminDatabaseQueries/updateState');

updatePlayerRouter.post('/combineResults', (req) => {
  const { playerOneName } = req.body;
  const { playerTwoName } = req.body;
  combineResults(playerOneName, playerTwoName);
});

updatePlayerRouter.post('/updateMains', (req) => {
  const { playerName } = req.body;
  const mains = req.body.mains.split(' ');
  const { doWeDeletePrevious } = req.body;
  updateMains(playerName, mains, doWeDeletePrevious);
});

updatePlayerRouter.post('/updateState', (req) => {
  const { playerName } = req.body;
  const { state } = req.body;
  updateState(playerName, state);
});

module.exports = updatePlayerRouter;
