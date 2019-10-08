'use strict';

const { createPlayerFactory, Match } = require('glicko-two');

const client = require('../client');

const removePlayersWithNoData = () => {
  console.log('Removing players with no tournament data');
  client.query('DELETE FROM players WHERE tournaments = $1;', [[]])
    .catch((error) => {
      throw error;
    });
};

const updatePlayerInDatabase = (player) => {
  client.query(`UPDATE players SET 
  rating = $1,
  tournaments = $2,
  sets = $3,
  set_wins = $4,
  set_losses = $5,
  game_wins = $6,
  game_losses = $7,
  set_win_rate = $8,
  game_win_rate = $9,
  attendance = $10,
  active_attendance = $11,
  rating_history = $12,
  set_win_rate_history = $13,
  game_win_rate_history = $14
  WHERE name = $15;`,
  [
    Math.round(player.glickoProfile.rating),
    player.tournaments,
    player.sets,
    player.setWins,
    player.setLosses,
    player.gameWins,
    player.gameLosses,
    player.setWinRate,
    player.gameWinRate,
    player.attendance,
    player.activeAttendance,
    player.ratingHistory,
    player.setWinRateHistory,
    player.gameWinRateHistory,
    player.name,
  ]);
};

const processPlayers = (players) => {
  console.log('Processing players');
  const promises = Object.keys(players).map((playerId) => {
    return updatePlayerInDatabase(players[playerId]);
  });
  
  Promise.all(promises)
    .then(() => {
      removePlayersWithNoData();
    })
    .catch((error) => {
      throw error;
    });
};

const calculateWinRate = (wins, losses) => {
  if (wins === 0 && losses === 0) {
    return 100.00;
  }

  const newWinRate = ((wins / (wins + losses)) * 100).toFixed(2);
  
  return newWinRate;
};

const editPlayersBasedOnSet = (players, set) => {
  console.log('Editing player information based on set');
  const winnerName = set.winner_name;
  const loserName = set.loser_name;
  
  const winner = players[winnerName];
  const loser = players[loserName];
  
  if (winner.tournaments.includes(set.tournament_id) === false) {
    winner.tournaments.push(set.tournament_id);
    
    winner.attendance += 1;
    
    if ((new Date() - set.date) < (1000 * 60 * 60 * 24 * 30 * 6)) {
      winner.activeAttendance += 1;
    }
    
    const winnerSetWinRate = calculateWinRate(winner.setWins, winner.setLosses);
    const winnerGameWinRate = calculateWinRate(winner.gameWins, winner.gameLosses);

    winner.setWinRate = winnerSetWinRate;
    winner.setWinRateHistory.push(winnerSetWinRate);
    winner.gameWinRate = winnerGameWinRate;
    winner.gameWinRateHistory.push(winnerGameWinRate);
    
    winner.ratingHistory.push(Math.round(winner.glickoProfile.rating));
  }
  
  if (winner.sets.includes(set.id) === false) {
    winner.sets.push(set.id);
  } else {
    console.log('problem?');
  }
  
  if (loser.tournaments.includes(set.tournament_id) === false) {
    loser.tournaments.push(set.tournament_id);
    
    loser.attendance += 1;
    
    if ((new Date() - set.date) < (1000 * 60 * 60 * 24 * 30 * 2)) {
      loser.activeAttendance += 1;
    }
    
    const loserSetWinRate = calculateWinRate(loser.setWins, loser.setLosses);
    const loserGameWinRate = calculateWinRate(loser.gameWins, loser.gameLosses);
    
    loser.setWinRate = loserSetWinRate;
    loser.setWinRateHistory.push(loserSetWinRate);
    loser.gameWinRate = loserGameWinRate;
    loser.gameWinRateHistory.push(loserGameWinRate);
    
    loser.ratingHistory.push(Math.round(loser.glickoProfile.rating));
  }
  
  if (loser.sets.includes(set.id) === false) {
    loser.sets.push(set.id);
  } else {
    console.log('problem?');
  }
  
  const winnerScore = set.winner_score;
  const loserScore = set.loser_score;
  
  winner.setWins += 1;
  winner.gameWins += winnerScore;
  winner.gameLosses += loserScore;
  
  loser.setLosses += 1;
  loser.gameWins += loserScore;
  loser.gameLosses += winnerScore;
  
  const match = new Match(winner.glickoProfile, loser.glickoProfile);
  match.reportTeamAWon();
  match.updatePlayerRatings();
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

const getSetsFromDatabase = (resolve) => {
  const sets = [];
  console.log('Querying database for a complete list of sets');
  return client.query('SELECT * FROM sets ORDER BY date ASC;')
    .then((data) => {
      data.rows.forEach((set) => {
        sets.push(set);
      });

      resolve(sets);
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
      const createPlayer = createPlayerFactory({
        defaultRating: 1800,
        defaultVolatility: 0.06,
        tau: 0.5,
      });
    
      data.rows.forEach((player) => {
        const glickoProfile = createPlayer();
      
        players[`${player.name}`] = {
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
          glickoProfile,
        };
      });

      resolve(players);
    })
    .catch((error) => {
      throw error;
    });
};

const recalculatePlayerStatistics = () => {
  const players = new Promise((resolve) => {
    return getPlayerNamesFromDatabase(resolve);
  });
  
  const sets = new Promise((resolve) => {
    return getSetsFromDatabase(resolve);
  });
  
  
  Promise.all([players, sets])
    .then((values) => {
      console.log('Processing sets');
      processSetsPlayed(values[0], values[1]);
    })
    .catch((error) => {
      throw error;
    });
};

module.exports = recalculatePlayerStatistics;
