'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const { Client } = require('pg');
const app = express();

const PORT = process.env.PORT;

app.use(cors());
app.use(express.urlencoded({
  extended: true
}));
app.use(express.json());

app.listen(PORT, () => console.log(`Server up on Port: ${PORT}`));

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

client.connect();

app.get('/hitChallonge', (req, res) => {
  try {
    superagent.get(`https://DigitalSpaceman:${process.env.REACT_APP_CHALLONGE_API_KEY}@api.challonge.com/v1/tournaments.json`)
      // .withCredentials()
      .then((response) => {
        console.log(response);
        res.append(response);
        return res;
      });
  }
  catch (error) {
    console.error(error);
  }
});

app.all('*', (req, res) => {
  console.log('Returning 404 from catch-all route');
  return res.sendStatus(404);
});
