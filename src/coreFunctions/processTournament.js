'use strict';

const client = require('../client');
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
        filterSetsForTournament(tournament);
      }
    })
    .catch((error) => {
      throw error;
    });
};

const filterSetsForTournament = (tournament) => {
  console.log('Filtering sets for empty scores or DQ\'s');
  const rounds = ['0', '0'];
  tournament.matches.forEach((set) => {
    if (set.match.round > rounds[0]) {
      rounds[0] = set.match.round;
    }
    if (set.match.round < rounds[1]) {
      rounds[1] = set.match.round;
    }
  });

  const filteredForEmptyScores = tournament.matches.filter((set) => {
    return set.match.scores_csv !== '';
  });

  const filteredForDQSets = filteredForEmptyScores.filter((set) => {
    return set.match.scores_csv.match(/-/g).length === 1;
  });

  tournament.matches = filteredForDQSets;
  tournament.rounds = rounds;
  makePlayersObject(tournament);
};

const makePlayersObject = (tournament) => {
  const playerObject = {};

  tournament.participants.forEach((player) => {
    playerObject[player.participant.id] = {
      id: player.participant.id,
      name: player.participant.name,
      placement: player.participant.final_rank,
    };
  });

  tournament.players = playerObject;
  processTournamentSets(tournament);
};

const processTournamentSets = (tournament) => {
  const promises = tournament.matches.map((set) => {
    return storeSetInDatabase(set.match, tournament);
  });

  Promise.all(promises)
    .then(() => {
      processTournamentPlayers(tournament);
    })
    .catch((error) => {
      throw error;
    });
};

const storeSetInDatabase = (set, tournament) => {
  const id = set.id;
  const tournamentId = tournament.id;
  const tournamentName = tournament.name;
  const date = set.completed_at;
  const splitScores = set.scores_csv.split('');

  let winnerName = '';
  let loserName = '';
  let winnerScore = 0;
  let loserScore = 0;

  let round = '';

  if (tournament.players.hasOwnProperty(set.winner_id)) {
    winnerName = tournament.players[set.winner_id].name;
  }
  if (tournament.players.hasOwnProperty(set.loser_id)) {
    loserName = tournament.players[set.loser_id].name;
  }

  switch(set.round) {
  case(set.round === tournament.rounds[0]):
    round = 'Grand Finals';
    break;
  case(set.round === tournament.rounds[0] - 1):
    round = 'Winners Finals';
    break;
  case(set.round === tournament.rounds[0] - 2):
    round = 'Winners Semifinals';
    break;
  case(set.round === tournament.rounds[0] - 3 && tournament.rounds[0] > 5):
    round = 'Winners Quarterfinals';
    break;
  case(set.round === tournament.rounds[1]):
    round = 'Losers Finals';
    break;
  case(set.round === tournament.rounds[1] - 1):
    round = 'Losers Semifinals';
    break;
  case(set.round === tournament.rounds[1] -2):
    round = 'Losers Quarterfinals';
    break;
  case(set.round > 0):
    round = `Winners Round ${Math.abs(set.round)}`;
    break;
  case(set.round < 0):
    round = `Losers Round ${Math.abs(set.round)}`;
    break;
  default:
    break;
  }
  console.log(round);

  if (splitScores[0] > splitScores[2]) {
    winnerScore += splitScores[0];
    loserScore += splitScores[2];
  }
  if (splitScores[0] < splitScores[2]) {
    winnerScore += splitScores[2];
    loserScore += splitScores[0];
  }

  const queryConfig = {
    text: 'INSERT INTO sets (id, round, winner_name, loser_name, tournament_id, tournament_name, winner_score, loser_score, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);',
    values: [id, round, winnerName, loserName, tournamentId, tournamentName, winnerScore, loserScore, date],
  };

  console.log(`Storing set in database Winner: ${winnerName}, Loser: ${loserName}`);
  client.query(queryConfig);
};


const processTournamentPlayers = (tournament) => {
  const promises = Object.keys(tournament.players).map((player) => {
    return checkPlayersForNameAndStoreIfNotFound(tournament.players[player], tournament);
  });

  Promise.all(promises)
    .then(() => {
      storeTournamentInDatabase(tournament);
    })
    .catch((error) => {
      throw error;
    });
};

const checkPlayersForNameAndStoreIfNotFound = (player) => {
  console.log('Checking database for player');
  return client.query(`SELECT * FROM players WHERE players.name = $1;`, [player.name])
    .then((data) => {
      if (data.rowCount > 0) {
        console.log('Player found in database: Not stored', player.name);
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

const storeTournamentInDatabase = (tournament) => {
  const id = tournament.id;
  const name = tournament.name;

  const placements = {};
  Object.keys(tournament.players).forEach((player) => {
    if (placements.hasOwnProperty(tournament.players[player].placement)) {
      placements[tournament.players[player].placement].push(tournament.players[player].name);
    } else {
      placements[tournament.players[player].placement] = [tournament.players[player].name];
    }
  });
  JSON.stringify(placements);

  const url = tournament.full_challonge_url;
  const date = tournament.completed_at;

  const queryConfig = {
    text: 'INSERT INTO tournaments (id, name, placements, url, date) VALUES ($1, $2, $3, $4, $5);',
    values: [id, name, placements, url, date],
  };

  console.log('Storing tournament');
  client.query(queryConfig);

  console.log('Recalculating player statistics');
  recalculatePlayerStatistics();
};

module.exports = processTournament;