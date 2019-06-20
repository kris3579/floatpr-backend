'use strict';

const Player = require('glicko-two');
const { Outcome } = require('glicko-two');

const client = require('./client');

client.connect();

const recalculatePlayerStatistics = () => {
  const players = getPlayersFromDatabase();
  const sets = getSetsFromDatabase();

  processSetsPlayed(players, sets);
};

const getPlayersFromDatabase = () => {
  const players = {};
  console.log('Querying database for complete list of players');
  client.query('SELECT * FROM players;')
    .then((response) => {
      response.body.forEach((player) => {
        players[player.name] = {
          name: player.name,
          setWins: 0,
          setLosses: 0,
          gameWins: 0,
          gameLosses: 0,
          setWinRate: 100,
          gameWinRate: 100,
          attendance: 0,
          ratingHistory: [],
          setWinRateHistory: [],
          gameWinRateHistory: [],
          lastActivity: new Date('January 1, 2000'),
          glicko: new Player({
            rating: 1800,
            ratingDeviation: 350,
            tau: 0.7,
            volatility: 0.06
          })
        };
      });
      return players;
    })
    .catch((error) => {
      throw error;
    });
};

const getSetsFromDatabase = () => {
  const sets = [];
  console.log('Querying database for a complete list of sets');
  clientInformation.query('SELECT * FROM sets;')
    .then((response) => {
      response.body.forEach((set) => {
        sets.push(set);
      });
      orderSetsByDate(sets);
      return sets;
    })
    .catch((error) => {
      throw error;
    });
};

const orderSetsByDate = (sets) => {
  console.log('Sorting sets by date');
  sets.sort(function(a, b){
    return new Date(b.date) - new Date(a.date);
  });
};

const processSetsPlayed = (players, sets) => {
  sets.forEach((set) => {
    editPlayersBasedOnSet(players, set);
  });
  processPlayers(players);
};

const editPlayersBasedOnSet = (players, set) => {
  console.log('Editing player information based on set');
  const winnerName = set.winnerName;
  const loserName = set.loserName;

  const winner = players[winnerName];
  const loser = players[loserName];

  const winnerScore = set.winnerScore;
  const loserScore = set.loserScore;

  winner.setWins += 1;
  winner.gameWins += winnerScore;
  winner.gameLosses += loserScore;
  winner.attendance += 1;
  winner.lastActivity = set.completed_at;

  loser.setLosses += 1;
  loser.gameWins += loserScore;
  loser.gameLosses += winnerScore;
  loser.attendance += 1;
  loser.lastActivity = set.completed_at;

  const winnerSetWinRate = calculateWinRate(winner.setWins, winner.setLosses);
  const winnerGameWinRate = calculateWinRate(winner.gameWins, winner.gameLosses);

  const loserSetWinRate = calculateWinRate(loser.setWins, loser.setLosses);
  const loserGameWinRate = calculateWinRate(loser.gameWins, loser.gameLosses);

  winner.setWinRate = winnerSetWinRate;
  winner.setWinRateHistory.push(winnerSetWinRate);
  winner.gameWinRate = winnerGameWinRate;
  winner.gameWinRateHistory.push(winnerGameWinRate);

  loser.setWinRate = loserSetWinRate;
  loser.setWinRateHistory.push(loserSetWinRate);
  loser.gameWinRate = loserGameWinRate;
  loser.gameWinRateHistory.push(loserGameWinRate);

  winner.glicko.addResult(loser.glicko, Outcome.Win);
  loser.glicko.addResult(winner.glicko, Outcome.Loss);
  winner.glicko.updateRating();
  loser.glicko.updateRating();

  winner.ratingHistory.push(winner.glicko.rating);
  loser.ratingHistory.push(loser.glicko.rating);
};

const calculateWinRate = (wins, losses) => {
  console.log('Caluclating win rate');
  const newWinRate = Math.round(((wins / (wins + losses)) * 100) * 100) / 100;
  return newWinRate;
};

const processPlayers = (players) => {
  players.forEach((player) => {
    storePlayerInDatabase(player);
  });
};

const storePlayerInDatabase = (player) => {
  console.log(`Updating rating, setWins, setLosses, gameWins, gameLosses, setWinRate, gameWinRate, attendance, ratingHistory, setWinRateHistory, gameWinRateHistory, and lastActivity for ${player.name}`);
  client.query(`UPDATE players SET 
    rating = ${player.glicko.rating},
    setWins = ${player.setWins},
    setLosses = ${player.setLosses},
    gameWins = ${player.gameWins},
    gameLosses = ${player.gameLosses},
    setWinRate = ${player.setWinRate},
    gameWinRate = ${player.gameWinRate},
    attendance = ${player.attendance},
    ratingHistory = ${player.ratingHistory},
    setWinRateHistory = ${player.setWinRateHistory},
    gameWinRateHistory = ${player.gameWinRateHistory}
  WHERE name = ${player.name};`);
};

module.exports = recalculatePlayerStatistics;