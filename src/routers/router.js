'use strict';

const express = require('express');

const router = express.Router();

const client = require('../client');

client.connect();

const getDatabaseDataRoutes = require('./getDatabaseDataRoutes');
const getTournamentDataRoutes = require('./getTournamentDataRoutes');
const handleRequestRoutes = require('./handleRequestRoutes');

router.use(getDatabaseDataRoutes);
router.use(getTournamentDataRoutes);
router.use(handleRequestRoutes);

router.all('*', (req, res) => {
  console.log('Returning 404 from catch-all route');
  return res.sendStatus(404);
});

module.exports = router;
