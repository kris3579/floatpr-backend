'use strict';

const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URI,
  ssl: true,
});

module.exports = client;