'use strict';

const superagent = require('superagent');
const Player = require('glicko-two');
const { Outcome } = require('glicko-two');

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
  getMatchesForTournament(tournament, players);
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
    text: 'INSERT INTO players (id, name, rating, mains, wins, losses, winRate, attendance, ratingDev, volatility, ratingHistory, winRateHistory, lastActivity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);',
    values: [playerId, name, 1500, ['unknown'], 0, 0, 100, 0, 350, 0.06, [], [], tournamentDate],
  };

  console.log('Storing player in database', playerId, name);
  client.query(queryConfig);
};

const getMatchesForTournament = (tournament, players) => {
  console.log('Querying Challonge for tournament matches');
  superagent.get(`https://DigitalSpaceman:${process.env.CHALLONGE_API_KEY}@api.challonge.com/v1/tournaments/${tournament.id}/matches.json`)
    .then((response) => {
      processTournamentMatches(response.body, tournament, players);
    })
    .catch((error) => {
      throw error;
    });
};

const processTournamentMatches = (matches, tournament, players) => {
  matches.forEach((match) => {
    storeMatchInDatabase(match.match, players);
  });
  recalculatePlayerStatistics(matches);
};

const storeMatchInDatabase = (match, players) => {

  const id = match.id;
  const tournamentId = match.tournament_id;
  const scoreString = match.scores_csv;
  const date = match.completed_at;
  const splitScores = scoreString.split('');

  let winnerName = '';
  let loserName = '';
  let winnerScore = 0;
  let loserScore = 0;

  for (let i = 0; i < players.length; i++) {
    if (players[i][1] === match.winner_id) {
      winnerName = players[i][0];
    }
    if (players[i][1] === match.loser_id) {
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
    text: 'INSERT INTO matches (id, winnerName, loserName, tournamentId, winnerScore, loserScore, date) VALUES ($1, $2, $3, $4, $5, $6, $7);',
    values: [id, winnerName, loserName, tournamentId, winnerScore, loserScore, date],
  };

  console.log(`Storing match in database Winner: ${winnerName}, Loser: ${loserName}`);
  client.query(queryConfig);
};

module.exports = processTournament;