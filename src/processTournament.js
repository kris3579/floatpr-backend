'use strict';

const superagent = require('superagent');

const client = require('./client');
const recalculatePlayerStatistics = require('./recalculatePlayerStatistics');

client.connect();

const processTournament = (tournament) => {
  console.log('Processing');
  checkDatabaseForTournament(tournament);
};

const checkDatabaseForTournament = (tournament) => {
  console.log('Checking database for tournament');
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
  const date = tournament.completed_at;

  const queryConfig = {
    text: 'INSERT INTO tournaments (name, url, id, date) VALUES ($1, $2, $3, $4);',
    values: [name, url, id, date],
  };

  console.log('Storing tournament');
  client.query(queryConfig);
  getPlayerNamesFromChallonge(tournament);
};

const getPlayerNamesFromChallonge = (tournament) => {
  console.log('Querying Challonge for the players tags using the tournament id');
  superagent.get(`https://DigitalSpaceman:${process.env.CHALLONGE_API_KEY}@api.challonge.com/v1/tournaments/${tournament.id}/participants.json`)
    .then((response) => {
      const playerArray = [];
      response.body.forEach((player) => {
        playerArray.push([player.participant.name, player.participant.id]);
      });
      processPlayersInTournament(playerArray, tournament);
    })
    .catch((error) => {
      throw error;
    });
};

const processPlayersInTournament = (players, tournament) => {
  players.forEach((player) => {
    checkPlayersForName(player, tournament);
  });
  getSetsForTournament(tournament, players);
};

const checkPlayersForName = (player, tournament) => {
  console.log('Checking database for player');
  return client.query(`SELECT * FROM players WHERE players.name = $1;`, [player[0]])
    .then((data) => {
      if (data.rowCount > 0) {
        console.log('Player found in database: Not stored');
      }
      if (data.rowCount === 0) {
        storePlayerInDatabase(player[1], player[0], tournament.completed_at);
      }
    })
    .catch((error) => {
      throw error;
    });
};

const storePlayerInDatabase = (playerId, name, tournamentDate) => {
  const queryConfig = {
    text: 'INSERT INTO players (id, name, rating, mains, setWins, setLosses, gameWins, gameLosses, setWinRate, gameWinRate, attendance, ratingHistory, setWinRateHistory, gameWinRateHistory, lastActivity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15);',
    values: [playerId, name, 1800, ['unknown'], 0, 0, 0, 0, 100, 100, 0, [], [], [], tournamentDate],
  };

  console.log('Storing player in database', playerId, name);
  client.query(queryConfig);
};

const getSetsForTournament = (tournament, players) => {
  console.log('Querying Challonge for tournament sets');
  superagent.get(`https://DigitalSpaceman:${process.env.CHALLONGE_API_KEY}@api.challonge.com/v1/tournaments/${tournament.id}/sets.json`)
    .then((response) => {
      processTournamentSets(response.body, players);
    })
    .catch((error) => {
      throw error;
    });
};

const processTournamentSets = (sets, players) => {
  sets.forEach((set) => {
    storeSetInDatabase(set.set, players);
  });
  recalculatePlayerStatistics(sets);
};

const storeSetInDatabase = (set, players) => {

  const id = set.id;
  const tournamentId = set.tournament_id;
  const scoreString = set.scores_csv;
  const date = set.completed_at;
  const splitScores = scoreString.split('');

  let winnerName = '';
  let loserName = '';
  let winnerScore = 0;
  let loserScore = 0;

  for (let i = 0; i < players.length; i++) {
    if (players[i][1] === set.winner_id) {
      winnerName = players[i][0];
    }
    if (players[i][1] === set.loser_id) {
      loserName = players[i][0];
    }
  }

  if (splitScores[0] > splitScores[2]) {
    winnerScore += splitScores[0];
    loserScore += splitScores[2];
  }
  if (splitScores[0] < splitScores[2]) {
    winnerScore += splitScores[2];
    loserScore += splitScores[0];
  }

  const queryConfig = {
    text: 'INSERT INTO sets (id, winnerName, loserName, tournamentId, winnerScore, loserScore, date) VALUES ($1, $2, $3, $4, $5, $6, $7);',
    values: [id, winnerName, loserName, tournamentId, winnerScore, loserScore, date],
  };

  console.log(`Storing set in database Winner: ${winnerName}, Loser: ${loserName}`);
  client.query(queryConfig);
};

module.exports = processTournament;