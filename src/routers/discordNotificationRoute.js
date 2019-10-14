'use strict';

const express = require('express');

const discordNotificationRouter = express.Router();

const sendNotificationToDiscord = require('../coreFunctions/sendNotificationToDiscord');

discordNotificationRouter.post('/userRequest', (req) => {
  console.log('Recieved request from user to send to Kris at discord');
  console.log(req.body);
  sendNotificationToDiscord(req.body);
});

module.exports = discordNotificationRouter;
