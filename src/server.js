'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

const { PORT } = process.env;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
  extended: true,
}));

app.listen(PORT, () => {
  console.log(`Server up on Port: ${PORT}`);
});

const client = require('./client');

client.connect();

const discordNotificationRoute = require('./routers/discordNotificationRoute');
const getDatabaseDataRoutes = require('./routers/getDatabaseDataRoutes');
const getTournamentDataRoutes = require('./routers/getTournamentDataRoutes');
const updatePlayerRoutes = require('./routers/updateDatabaseRoutes');

const adminAuthenticator = require('./auth/adminAuthenticator.js');

app.use(getDatabaseDataRoutes);
app.use(discordNotificationRoute);

app.use(adminAuthenticator);

app.use(getTournamentDataRoutes);
app.use(updatePlayerRoutes);

app.all('*', (req, res) => {
  console.log('Returning 404 from catch-all route');
  return res.sendStatus(404);
});
