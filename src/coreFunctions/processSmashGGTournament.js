'use strict';

const smashGG = require('smashgg.js');

const client = require('../client');
const recalculatePlayerStatistics = require('./recalculatePlayerStatistics');

smashGG.initialize(process.env.SMASHGG_API_KEY);

const storeTournamentInDatabase = (tournamentData) => {
  const { id, name } = tournamentData.tournament;

  const placements = {};

  tournamentData.standings.forEach((player) => {
    if (Object.hasOwnProperty.call(placements, player.placement)) {
      placements[player.placement].push(player.entrant.name);
    } else {
      placements[player.placement] = player.entrant.name;
    }
  });

  JSON.stringify(placements);

  const { url, date } = tournamentData.tournament;

  const queryConfig = {
    text: 'INSERT INTO tournaments (id, name, placements, url, date) VALUES ($1, $2, $3, $4, $5);',
    values: [id, name, placements, url, date],
  };

  console.log('Storing tournament');
  client.query(queryConfig);

  console.log('Recalculating player statistics');
  recalculatePlayerStatistics();
};

const checkPlayersForNameAndSToreIfNotFound = (player) => {
  console.log('Checking database for the player');
  return client.query('SELECT * FROM players WHERE player.name = $1', [player.tag])
    .then((data) => {
      if (data.rowCount > 0) {
        console.log('Player found in database: Not stored', player.tag);
      }
      if (data.rowCount === 0) {
        const queryConfig = {
          text: 'INSERT INTO players (id, name, rating, mains, state, tournaments, sets, set_wins, set_losses, game_wins, game_losses, set_win_rate, game_win_rate, attendance, active_attendance, rating_history, set_win_rate_history, game_win_rate_history) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18);',
          values: [player.id, player.name, 1800, ['unknown'], 'WA', [], [], 0, 0, 0, 0, 100, 100, 0, 0, [], [], []],
        };

        console.log('Storing player in database', player.name, player.id);
        client.query(queryConfig);
      }
    })
    .catch((error) => {
      throw error;
    });
};

const processTournamentEntrants = (tournamentData) => {
  const promises = tournamentData.entrants.map((entrant) => {
    return checkPlayersForNameAndSToreIfNotFound(entrant);
  });

  Promise.all(promises)
    .then(() => {
      storeTournamentInDatabase(tournamentData);
    })
    .catch((error) => {
      throw error;
    });
};

const storeSetInDatabase = (set, tournamentData) => {
  const { id } = set;
  const tournamentid = tournamentData.tournament.id;
  const tournamentName = tournamentData.tournament.name;
  const date = set.completedAt;
  const round = set.fullRoundText;

  let winnerName = '';
  let winnerScore = 0;
  let loserName = '';
  let loserScore = 0;

  if (set.score1 > set.score2) {
    winnerName = set.player1.tag;
    winnerScore += set.score1;
    loserName = set.player2.tag;
    loserScore += set.score2;
  }
  if (set.score2 < set.score1) {
    winnerName = set.player2.tag;
    winnerScore += set.score2;
    loserName = set.player1.tag;
    loserScore += set.score1;
  }

  const queryConfig = {
    text: 'INSERT INTO sets (id, round, winner_name, loser_name, tournament_id, tournament_name, winner_score, loser_score, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);',
    values: [
      id,
      round,
      winnerName,
      loserName,
      tournamentid,
      tournamentName,
      winnerScore,
      loserScore,
      date,
    ],
  };

  console.log(`Storing set in database Winner: ${winnerName}, Loser: ${loserName}`);
  client.query(queryConfig);
};

const processTournamentSets = (tournamentData) => {
  console.log('Retreving sets from tournament');
  const promises = tournamentData.sets.map((set) => {
    return storeSetInDatabase(set, tournamentData.tournament);
  });

  Promise.all(promises)
    .then(() => {
      processTournamentEntrants(tournamentData);
    })
    .catch((error) => {
      throw error;
    });
};

const checkDatabaseForTournament = (tournamentData) => {
  console.log('Checking database for tournament');
  return client.query(`SELECT name FROM tournaments WHERE id = ${tournamentData.tournament.id};`)
    .then((data) => {
      if (data.rowCount > 0) {
        console.log('Tournament found in database: Not stored');
      }
      if (data.rowCount === 0) {
        console.log('Process tournament sets');
        // processTournamentSets(tournamentData);
      }
    })
    .catch((error) => {
      throw error;
    });
};

const processSmashGGTournament = (tournamentData) => {
  console.log('Processing');
  checkDatabaseForTournament(tournamentData);
};

module.exports = processSmashGGTournament;
