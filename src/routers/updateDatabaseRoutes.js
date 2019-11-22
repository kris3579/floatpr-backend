'use strict';

const express = require('express');

const updatePlayerRouter = express.Router();

const combineResults = require('../adminDatabaseQueries/combineResults');
const updateMains = require('../adminDatabaseQueries/updateMains');
const updateState = require('../adminDatabaseQueries/updateState');
const updateSponser = require('../adminDatabaseQueries/updateSponser');
const updateSetSponsers = require('../adminDatabaseQueries/updateSponsers');
const recalculatePlayerStatistics = require('../coreFunctions/recalculatePlayerStatistics');

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

updatePlayerRouter.post('/updateSponser', (req, res) => {
  const { playerName, sponser } = req.body;

  new Promise((resolve) => {
    updateSponser(playerName, sponser, resolve);
  })
    .then(() => {
      res.sendStatus(200);
    })
    .catch(() => {
      res.sendStatus(500);
    });
});

updatePlayerRouter.post('/updateSetSponsers', (req, res) => {
  new Promise((resolve) => {
    updateSetSponsers(resolve);
  })
    .then(() => {
      res.sendStatus(200);
    })
    .catch(() => {
      res.sendStatus(500);
    });
});

updatePlayerRouter.post('/updatePlayerStatistics', (req, res) => {
  recalculatePlayerStatistics();
  res.sendStatus(200);
});

module.exports = updatePlayerRouter;
