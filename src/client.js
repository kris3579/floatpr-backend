'use strict';

const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URI,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = client;
