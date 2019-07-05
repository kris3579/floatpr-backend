'use strict';

const superagent = require('superagent');

const client = require('./client');
const recalculatePlayerStatistics = require('./recalculatePlayerStatistics');

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
        getPlayersForTournament(tournament);
      }
    })
    .catch((error) => {
      throw error;
    });
};

const getPlayersForTournament = (tournament) => {
  console.log('Querying Challonge for the players tags using the tournament id');
  superagent.get(`https://DigitalSpaceman:${process.env.CHALLONGE_API_KEY}@api.challonge.com/v1/tournaments/${tournament.id}/participants.json`)
    .then((response) => {
      const playerObject = {};
      response.body.forEach((player) => {
        playerObject[player.participant.id] = {
          id: player.participant.id,
          name: player.participant.name,
          placement: player.participant.final_rank,
        };
      });
      getSetsForTournament(tournament, playerObject);
    })
    .catch((error) => {
      throw error;
    });
};

const getSetsForTournament = (tournament, players) => {
  console.log('Querying Challonge for tournament sets');
  superagent.get(`https://DigitalSpaceman:${process.env.CHALLONGE_API_KEY}@api.challonge.com/v1/tournaments/${tournament.id}/matches.json`)
    .then((response) => {
      const setsArray = [];
      response.body.forEach((set) => {
        setsArray.push(set.match.id);
      });
      tournament.sets = setsArray;
      processTournamentSets(response.body, players, tournament);
    })
    .catch((error) => {
      throw error;
    });
};

const processTournamentSets = (sets, players, tournament) => {
  const promises = sets.map((set) => {
    return storeSetInDatabase(set.match, players, tournament);
  });

  Promise.all(promises)
    .then(() => {
      processPlayersInTournament(players, tournament);
    })
    .catch((error) => {
      throw error;
    });
};

const storeSetInDatabase = (set, players, tournament) => {
  const id = set.id;
  const tournamentId = tournament.id;
  const tournamentName = tournament.name;
  const date = set.completed_at;
  const splitScores = set.scores_csv.split('');

  let winnerName = '';
  let loserName = '';
  let winnerScore = 0;
  let loserScore = 0;

  if (players.hasOwnProperty(set.winner_id)) {
    winnerName = players[set.winner_id].name;
  }
  if (players.hasOwnProperty(set.loser_id)) {
    loserName = players[set.loser_id].name;
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
    text: 'INSERT INTO sets (id, winner_name, loser_name, tournament_id, tournament_name, winner_score, loser_score, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);',
    values: [id, winnerName, loserName, tournamentId, tournamentName, winnerScore, loserScore, date],
  };

  console.log(`Storing set in database Winner: ${winnerName}, Loser: ${loserName}`);
  client.query(queryConfig);
};


const processPlayersInTournament = (players, tournament) => {
  const promises = Object.keys(players).map((player) => {
    return checkPlayersForNameAndStoreIfNotFound(players[player], tournament);
  });

  Promise.all(promises)
    .then(() => {
      storeTournamentInDatabase(tournament, players);
    })
    .catch((error) => {
      throw error;
    });
};


const checkPlayersForNameAndStoreIfNotFound = (player, tournament) => {
  console.log('Checking database for player');
  return client.query(`SELECT * FROM players WHERE players.name = $1;`, [player.name])
    .then((data) => {
      if (data.rowCount > 0) {
        console.log('Player found in database: Not stored');
      }
      if (data.rowCount === 0) {
        const queryConfig = {
          text: 'INSERT INTO players (id, name, rating, mains, tournaments, sets, set_wins, set_losses, game_wins, game_losses, set_win_rate, game_win_rate, attendance, active_attendance, rating_history, set_win_rate_History, game_win_rate_history, last_activity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18);',
          values: [player.id, player.name, 1800, ['unknown'], [], [], 0, 0, 0, 0, 100, 100, 0, 0, [], [], [], tournament.completed_at],
        };

        console.log('Storing player in database', player.name, player.id);
        client.query(queryConfig);
      }
    })
    .catch((error) => {
      throw error;
    });
};

const storeTournamentInDatabase = (tournament, players) => {
  const id = tournament.id;
  const name = tournament.name;

  const placements = {};
  Object.keys(players).forEach((player) => {
    if (placements.hasOwnProperty(players[player].placement)) {
      placements[players[player].placement].push(players[player].name);
    } else {
      placements[players[player].placement] = [players[player].name];
    }
  });
  JSON.stringify(placements);

  const sets = tournament.sets;
  const url = tournament.url;
  const date = tournament.completed_at;

  const queryConfig = {
    text: 'INSERT INTO tournaments (id, name, placements, sets, url, date) VALUES ($1, $2, $3, $4, $5, $6);',
    values: [id, name, placements, sets, url, date],
  };

  console.log('Storing tournament');
  client.query(queryConfig);

  console.log('Recalculating player statistics');
  recalculatePlayerStatistics();
};

module.exports = processTournament;