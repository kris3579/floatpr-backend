'use strict';

const superagent = require('superagent');
const client = require('./client');

client.connect();

const processTournament = (tournament) => {
  console.log('Processing');
  checkDatabaseForTournament(tournament);
};

const checkDatabaseForTournament = (tournament) => {
  return client.query(`SELECT name FROM tournaments WHERE id = ${tournament.id};`)
    .then((data) => {
      if (data.rowCount > 0) {
        console.log('Tournament found in database: Not stored');
      }
      if (data.rowCount === 0) {
        storeTournamentInDatabase(tournament);
      }
    })
    .catch((error) => {
      throw error;
    });
};

const storeTournamentInDatabase = (tournament) => {
  const name = tournament.name;
  const url = tournament.url;
  const id = tournament.id;
  const date = new Date();

  const queryConfig = {
    text: 'INSERT INTO tournaments (name, url, id, date) VALUES ($1, $2, $3, $4);',
    values: [name, url, id, date],
  };

  console.log('Storing tournament');
  client.query(queryConfig);
  getMatchesForTournament(tournament);
};

const getMatchesForTournament = (tournament) => {
  console.log('Querying Challonge for tournament matches');
  superagent.get(`https://DigitalSpaceman:${process.env.CHALLONGE_API_KEY}@api.challonge.com/v1/tournaments/${tournament.id}/matches.json`)
    .then((response) => {
      processTournamentMatches(response.body, tournament);
    })
    .catch((error) => {
      throw error;
    });
};

const processTournamentMatches = (matches, tournament) => {
  const players = [];

  matches.forEach((match) => {
    if (players.indexOf(match.match.winner_id) === -1) {
      players.push(match.match.winner_id);
    }
    if (players.indexOf(match.match.loser_id) === -1) {
      players.push(match.match.loser_id);
    }
    // storeMatchInDatabase(match.match);
  });

  getPlayerNamesFromChallonge(tournament);
  processTournamentResults(matches);
};

// const storeMatchInDatabase = (match) => {
//   const id = match.id;
//   const winnerId = match.winner_id;
//   const loserId = match.loser_id;
//   const tournamentId = match.tournament_id;
//   let winnerScore = 0;
//   let loserScore = 0;
//   const scoreGained = 0;

//   const scoreString = match.scores_csv;
//   const splitScores = scoreString.split('');

//   if (splitScores[0] > splitScores[2]) {
//     winnerScore += splitScores[0];
//     loserScore += splitScores[2];
//   }
//   if (splitScores[0] < splitScores[2]) {
//     winnerScore += splitScores[2];
//     loserScore += splitScores[0];
//   }

//   const queryConfig = {
//     text: 'INSERT INTO matches (id, winnerId, loserId, tournamentId, winnerScore, loserScore, scoreGained) VALUES ($1, $2, $3, $4, $5, $6, $7);',
//     values: [id, winnerId, loserId, tournamentId, winnerScore, loserScore, scoreGained],
//   };

//   console.log('Storing match in database');
//   client.query(queryConfig);
// };


const getPlayerNamesFromChallonge = (tournament) => {
  console.log('Querying Challonge for the players tags using the tournament id');
  superagent.get(`https://DigitalSpaceman:${process.env.CHALLONGE_API_KEY}@api.challonge.com/v1/tournaments/${tournament.id}/participants.json`)
    .then((response) => {
      const playerArray = [];
      response.body.forEach((player) => {
        playerArray.push([player.participant.name, player.participant.id]);
      });
      processPlayersInTournament(playerArray);
    })
    .catch((error) => {
      throw error;
    });
};
const processPlayersInTournament = (players) => {
  players.forEach((player) => {
    // checkPlayersForName(player);

    getPlayerAttendance(player[0]);
  });
};

const checkPlayersForName = (player) => {
  console.log('Checking database for player');
  return client.query(`SELECT id FROM players WHERE name = ${player[0]};`)
    .then((data) => {
      if (data.rowCount > 0) {
        console.log('Player found in database: Not stored');
      }
      if (data.rowCount === 0) {
        storePlayerInDatabase(player[1], player[0]);
      }
    })
    .catch((error) => {
      throw error;
    });
};

const storePlayerInDatabase = (playerId, name) => {
  const queryConfig = {
    text: 'INSERT INTO players (id, name, score, mains, wins, losses, winRate, attendance) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);',
    values: [playerId, name, 0, ['unknown'], 0, 0, 100, 0],
  };

  console.log('Storing player in database', playerId, name);
  client.query(queryConfig);
};

const getPlayerAttendance = (playerName) => {
  console.log('Querying database for player attendance');
  // client.query(`SELECT attendance FROM players WHERE name = ${playerName}`)
  // .then((attendance) => {
  //   addToPlayerAttendance(playerName, attendance);
  // });
};

const addToPlayerAttendance = (player, attendance) => {
  console.log('Adding to player attendance');
  const newAttendance = attendance + 1;
  console.log(newAttendance);
  // client.query(`UPDATE players SET attendance = ${newAttendance} WHERE name = ${player};`);
};


const processTournamentResults = (matches) => {
  matches.forEach((match) => {
    const winnerId = match.winner_id;
    const loserId = match.loser_id;

    editPlayerStatistics(winnerId, loserId);
  });
};

const editPlayerStatistics = (winnerId, loserId) => {
  const winner = getPlayerInfo(winnerId);
  // const loser = getPlayerInfo(loserId);

  console.log(winner);

  // const newWinnerScore = calculateNewScore(winner.previousScore, winner.attendance, loser.previousScore);
  // const newWinnerWinRate = calculateNewWinRate(winner.wins + 1, winner.losses);
  // const newLoserWinRate = calculateNewWinRate(loser.wins, loser.losses + 1);

  // updateWinsAndScoreAndWinRateForWinnerInDatabase(winnerId, winner.wins + 1, newWinnerScore, newWinnerWinRate);
  // updateLossesAndWinRateForLoserInDatabase(loserId, loser.losses + 1, newLoserWinRate);
};

const getPlayerInfo = (playerId) => {
  const playerObject = {};
  console.log('Querying the database for the player\'s info using the playerId');
  client.query(`SELECT * FROM players WHERE id = ${playerId}`)
    .then((data) => {
      console.log(data);
      playerObject.previousScore = data.score;
      playerObject.wins = data.wins;
      playerObject.losses = data.losses;
      playerObject.winRate = data.winRate;
      playerObject.attendance = data.attendance;
    });

  return playerObject;
};

// const calculateNewScore = (previousScore, attendance, loserScore) => {
//   console.log('Calculating new score for winner');
//   const playerDifferenceMod = 1;

//   if (previousScore > loserScore) {
//     playerDifferenceMod - .5;
//   }
//   if (previousScore < loserScore) {
//     playerDifferenceMod + .5;
//   }

//   const newScore = (previousScore + playerDifferenceMod + 1) / attendance;
//   return newScore;
// };

// const calculateNewWinRate = (wins, losses) => {
//   console.log('Caluclating new win rate for player');
//   const newWinRate = wins / (wins + losses);
//   return newWinRate;
// };

// const updateWinsAndScoreAndWinRateForWinnerInDatabase = (playerId, newWins, newScore, newWinRate) => {
//   console.log('Updating wins, score, and winRate for the winner in the database');
//   client.query(`UPDATE players SET wins = ${newWins}, score = ${newScore}, winRate = ${newWinRate} WHERE id = ${playerId};`);
// };

// const updateLossesAndWinRateForLoserInDatabase = (playerId, newLosses, newWinRate) => {
//   console.log('Updating losses, winRate for the loser in the database');
//   client.query(`UPDATE players SET losses = ${ newLosses}, winRate = ${newWinRate} WHERE id = ${playerId};`);
// };

module.exports = processTournament;