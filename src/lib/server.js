'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client } = require('pg');

const middleWare = require('./middlware.js');
const router = require('./router.js');

const app = express();

const PORT = process.env.PORT;

app.use(cors());
app.use(middleWare);
app.use(router);

app.all('*', (req, res) => {
  console.log('Returning 404 from catch-all route');
  return res.sendStatus(404);
});

const server = module.exports = {};

server.start = () => {
  return internalServer = app.listen(PORT, () => {
    console.log(`Server listening at port ${PORT}`);
  });
};

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

client.connect();

app.set('view engline', 'ejs');

app/get('/', (req, res) => {
  homepage(req, res);
});