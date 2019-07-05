'use strict';
// const Player = require('glicko-two');
const { Player, Outcome } = require('glicko-two');

const client = require('./client');

const recalculatePlayerStatistics = () => {
  let players = null;
  let sets = null;

  const promise1 = new Promise((resolve) => {
    players = getPlayerNamesFromDatabase(resolve);
  });

  const promise2 = new Promise((resolve) => {
    sets = getSetsFromDatabase(resolve);
  });


  Promise.all([promise1, promise2])
    .then(() => {
      processSetsPlayed(players, sets);
    })
    .catch((error) => {
      throw error;
    });
};

const getPlayerNamesFromDatabase = (resolve) => {
  const players = {};
  console.log('Querying database for complete list of players');
  client.query('SELECT name FROM players;')
    .then((data) => {
      const glickoProfile = new Player({
        defaultRating: 1800,
        rating: 1800,
        ratingDeviation: 350,
        tau: 0.7,
        volatility: 0.06
      });

      data.rows.forEach((player) => {
        players[player.name] = {
          name: player.name,
          tournaments: [],
          sets: [],
          setWins: 0,
          setLosses: 0,
          gameWins: 0,
          gameLosses: 0,
          setWinRate: 100,
          gameWinRate: 100,
          attendance: 0,
          activeAttendance: 0,
          ratingHistory: [],
          setWinRateHistory: [],
          gameWinRateHistory: [],
          lastActivity: new Date('January 1, 2000'),
          glickoProfile: glickoProfile
        };
      });
    })
    .catch((error) => {
      throw error;
    });
  resolve();
  return players;
};

const getSetsFromDatabase = (resolve) => {
  const sets = [];
  console.log('Querying database for a complete list of sets');
  client.query('SELECT * FROM sets;')
    .then((data) => {
      data.rows.forEach((set) => {
        sets.push(set);
      });
      orderSetsByDate(sets, resolve);
    })
    .catch((error) => {
      throw error;
    });
  return sets;
};

const orderSetsByDate = (sets, resolve) => {
  console.log('Sorting sets by date');
  sets.sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });
  resolve();
};

const processSetsPlayed = (players, sets) => {
  const promises = sets.map((set) => {
    return editPlayersBasedOnSet(players, set);
  });

  Promise.all(promises)
    .then(() => {
      processPlayers(players);
    })
    .catch((error) => {
      throw error;
    });
};

const editPlayersBasedOnSet = (players, set) => {
  console.log('Editing player information based on set');
  const winnerName = set.winner_name;
  const loserName = set.loser_name;

  const winner = players[winnerName];
  const loser = players[loserName];

  const winnerScore = set.winner_score;
  const loserScore = set.loser_score;

  winner.setWins += 1;
  winner.gameWins += winnerScore;
  winner.gameLosses += loserScore;
  winner.lastActivity = set.date;

  if (winner.tournaments.includes(set.tournament_id) === false) {
    winner.tournaments.push(set.tournament_id);
    winner.attendance += 1;

    if ((new Date() - set.date) > 1000 * 60 * 60 * 24 * 30 * 2) {
      winner.activeAttendance += 1;
    }
  }

  if (winner.sets.includes(set.id) === false) {
    winner.sets.push(set.id);
  }

  loser.setLosses += 1;
  loser.gameWins += loserScore;
  loser.gameLosses += winnerScore;
  loser.lastActivity = set.date;

  if (loser.tournaments.includes(set.tournament_id) === false) {
    loser.tournaments.push(set.tournament_id);
    loser.attendance += 1;

    if ((new Date() - set.date) > 1000 * 60 * 60 * 24 * 30 * 2) {
      loser.activeAttendance += 1;
    }
  }

  if (loser.sets.includes(set.id) === false) {
    loser.sets.push(set.id);
  }

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

  console.log(winner.glickoProfile);
  winner.glickoProfile.addResult(loser.glickoProfile, Outcome.Win);
  loser.glickoProfile.addResult(winner.glickoProfile, Outcome.Lose);
  winner.glickoProfile.updateRating();
  loser.glickoProfile.updateRating();
  console.log(winner.glickoProfile);

  winner.ratingHistory.push(winner.glickoProfile.rating);
  loser.ratingHistory.push(loser.glickoProfile.rating);
};

const calculateWinRate = (wins, losses) => {
  console.log('Caluclating win rate');
  const newWinRate = Math.round(((wins / (wins + losses)) * 100) * 100) / 100;
  return newWinRate;
};

const processPlayers = (players) => {
  console.log('Processing players', players);
  Object.keys(players).forEach((playerId) => {
    // updatePlayerInDatabase(players[playerId]);
  });
};

const updatePlayerInDatabase = (player) => {
  console.log(`Updating rating, tournaments, sets, set_wins, set_losses, game_wins, game_losses, set_win_rate, game_win_rate, attendance, active_attendance, rating_history, set_win_rate_history, game_win_rate_history, and last_activity for ${player.name}`);
  client.query(`UPDATE players SET 
    rating = ${player.glicko.rating},
    tournaments = ${player.tournaments},
    sets = ${player.sets},
    set_wins = ${player.setWins},
    set_losses = ${player.setLosses},
    game_wins = ${player.gameWins},
    game_losses = ${player.gameLosses},
    set_win_rate = ${player.setWinRate},
    game_win_rate = ${player.gameWinRate},
    attendance = ${player.attendance},
    active_attendance = ${player.activeAttendance},
    rating_history = ${player.ratingHistory},
    set_win_rate_history = ${player.setWinRateHistory},
    game_win_rate_history = ${player.gameWinRateHistory}
  WHERE name = ${player.name};`);
};

module.exports = recalculatePlayerStatistics;