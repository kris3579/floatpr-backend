'use strict';

const express = require('express');

const router = express.Router();

const client = require('../client');

client.connect();

const discordNotificationRoute = require('./discordNotificationRoute');
const getDatabaseDataRoutes = require('./getDatabaseDataRoutes');
const getTournamentDataRoutes = require('./getTournamentDataRoutes');
const updatePlayerRoutes = require('./updatePlayerRoutes');

const adminAuthenticator = require('./auth/adminAuthenticator.js');

router.use(getDatabaseDataRoutes);
router.use(discordNotificationRoute);

router.use(adminAuthenticator);

router.use(getTournamentDataRoutes);
router.use(updatePlayerRoutes);

router.all('*', (req, res) => {
  console.log('Returning 404 from catch-all route');
  return res.sendStatus(404);
});

module.exports = router;
