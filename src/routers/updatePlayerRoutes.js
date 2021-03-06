'use strict';

const express = require('express');

const updatePlayerRouter = express.Router();

const combineResults = require('../adminDatabaseQueries/combineResults');
const updateMains = require('../adminDatabaseQueries/updateMains');
const updateState = require('../adminDatabaseQueries/updateState');

updatePlayerRouter.post('/combineResults', (req, res) => {
  const { playerOneName, playerTwoName } = req.body;
  
  new Promise((resolve) => {
    combineResults(playerOneName, playerTwoName, resolve);
  })
    .then(() => {
      res.sendStatus(200);
    })
    .catch(() => {
      res.sendStatus(500);
    });
});

updatePlayerRouter.post('/updateMains', (req, res) => {
  const { playerName } = req.body;
  const mains = req.body.mains.split(' ');

  new Promise((resolve) => {
    updateMains(playerName, mains, resolve);
  })
    .then(() => {
      res.sendStatus(200);
    })
    .catch(() => {
      res.sendStatus(500);
    });
});

updatePlayerRouter.post('/updateState', (req, res) => {
  const { playerName, state } = req.body;

  new Promise((resolve) => {
    updateState(playerName, state, resolve);
  })
    .then(() => {
      res.sendStatus(200);
    })
    .catch(() => {
      res.sendStatus(500);
    });
});

module.exports = updatePlayerRouter;
