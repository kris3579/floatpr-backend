'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const routes = require('./src/routers/router');

const PORT = process.env.PORT;

app.use(cors());
app.use(express.urlencoded({
  extended: true
}));
app.use(express.json());

app.listen(PORT, () => console.log(`Server up on Port: ${PORT}`));

app.use(routes);