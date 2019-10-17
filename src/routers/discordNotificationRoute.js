'use strict';

const express = require('express');

const discordNotificationRouter = express.Router();

const sendNotificationToDiscord = require('../coreFunctions/sendNotificationToDiscord');

discordNotificationRouter.post('/userRequest', (req, res) => {
  console.log('Recieved request from user to send to Kris at discord');
  new Promise((resolve) => {
    sendNotificationToDiscord(req.body, resolve);
  })
    .then(() => {
      res.sendStatus(200);
    })
    .catch(() => {
      res.sendStatus(500);
    });
});

module.exports = discordNotificationRouter;
