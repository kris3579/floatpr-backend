'use strict';

const client = require('../client');
const recalculatePlayerStatistics = require('./recalculatePlayerStatistics');

const storeTournamentInDatabase = (tournament) => {
  const { id, name } = tournament;

  const placements = {};
  
  Object.keys(tournament.players).forEach((player) => {
    const playerPlacement = tournament.players[player].placement;
    const playerName = tournament.players[player].name;

    if (Object.hasOwnProperty.call(placements, playerPlacement)) {
      placements[playerPlacement].push(playerName);
    } else {
      placements[playerPlacement] = [playerName];
    }
  });
  JSON.stringify(placements);

  const entrants = tournament.participants_count;
  const url = tournament.full_challonge_url;
  const date = tournament.completed_at;

  console.log('Storing tournament');
  client.query(`INSERT INTO tournaments 
  (
    id,
    name,
    entrants,
    placements,
    url,
    date
  ) 
  VALUES 
  (
    $1, $2, $3, $4, $5, $6
  );`,
  [
    id,
    name,
    entrants,
    placements,
    url,
    date,
  ]);

  console.log('Recalculating player statistics');
  recalculatePlayerStatistics();
};

const checkPlayersForNameAndStoreIfNotFound = (player) => {
  console.log('Checking database for player');

  return client.query('SELECT * FROM players WHERE players.name = $1;', [player.name])
    .then((data) => {
      if (data.rowCount > 0) {
        console.log('Player found in database: Not stored', player.name);
      }
      if (data.rowCount === 0) {
        const jsonObject = JSON.stringify({});

        console.log('Storing player in database', player.name, player.id);
        client.query(`INSERT INTO players 
        (
          id,
          name,
          sponser,
          rating,
          mains,
          state,
          tournaments,
          tournament_names,
          sets,
          set_wins,
          set_losses,
          game_wins,
          game_losses,
          set_win_rate,
          game_win_rate,
          attendance,
          active_attendance,
          rating_history,
          set_win_rate_history,
          game_win_rate_history
        )
        VALUES 
        (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        );`,
        [
          player.id,
          player.name,
          player.sponser,
          1800,
          ['unknown'],
          'WA',
          [],
          [],
          [],
          0,
          0,
          0,
          0,
          100,
          100,
          0,
          0,
          jsonObject,
          jsonObject,
          jsonObject,
        ]);
      }
    })
    .catch((error) => {
      throw error;
    });
};

const processTournamentPlayers = (tournament) => {
  const promises = Object.keys(tournament.players).map((player) => {
    return checkPlayersForNameAndStoreIfNotFound(tournament.players[player], tournament);
  });

  Promise.all(promises)
    .then(() => {
      console.log('store tournament');
      storeTournamentInDatabase(tournament);
    })
    .catch((error) => {
      throw error;
    });
};

const storeSetInDatabase = (set, tournament) => {
  const { id } = set;
  const tournamentId = tournament.id;
  const tournamentName = tournament.name;
  const date = set.completed_at;
  const splitScores = set.scores_csv.split('');

  let winnerName = '';
  let loserName = '';
  let winnerScore = 0;
  let loserScore = 0;

  let round = '';

  if (Object.hasOwnProperty.call(tournament.players, set.winner_id)) {
    winnerName = tournament.players[set.winner_id].name;
  }
  if (Object.hasOwnProperty.call(tournament.players, set.loser_id)) {
    loserName = tournament.players[set.loser_id].name;
  }

  if (set.round > 0) {
    round = `Winners Round ${Math.abs(set.round)}`;
  }
  if (set.round < 0) {
    round = `Losers Round ${Math.abs(set.round)}`;
  }
  if (set.round === tournament.rounds[1] + 2) {
    round = 'Losers Quarterfinal';
  }
  if (set.round === tournament.rounds[1] + 1) {
    round = 'Losers Semifinal';
  }
  if (set.round === tournament.rounds[1]) {
    round = 'Losers Final';
  }
  if (set.round === tournament.rounds[0] - 3 && tournament.rounds[0] > 5) {
    round = 'Winners Quarterfinal';
  }
  if (set.round === tournament.rounds[0] - 2) {
    round = 'Winners Semifinal';
  }
  if (set.round === tournament.rounds[0] - 1) {
    round = 'Winners Final';
  }
  if (set.round === tournament.rounds[0]) {
    tournament.grandFinalsCounter += 1;
    round = 'Grand Final';
  }
  if (set.round === tournament.rounds[0] && tournament.grandFinalsCounter === 2) {
    round = 'Grand Final Reset';
  }

  if (splitScores[0] > splitScores[2]) {
    winnerScore += splitScores[0];
    loserScore += splitScores[2];
  }
  if (splitScores[0] < splitScores[2]) {
    winnerScore += splitScores[2];
    loserScore += splitScores[0];
  }
  

  console.log(`Storing set in database Winner: ${winnerName}, Loser: ${loserName}`);
  client.query(`INSERT INTO sets 
  (
    id,
    round,
    winner_name,
    loser_name,
    tournament_id,
    tournament_name,
    winner_score,
    loser_score,
    date
  )
  VALUES
  (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
  );`,
  [
    id,
    round,
    winnerName,
    loserName,
    tournamentId,
    tournamentName,
    winnerScore,
    loserScore,
    date,
  ]);
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

const makePlayersObject = (tournament) => {
  const playerObject = {};

  tournament.participants.forEach((player) => {
    const noMultipleSpaces = player.participant.name.replace(/\s{2,}/, '');

    const name = noMultipleSpaces.match(/\w[^|]+$/);
    const sponser = noMultipleSpaces.match(/.*\b(?=.\|)/) || '';

    playerObject[player.participant.id] = {
      id: player.participant.id,
      name,
      sponser,
      placement: player.participant.final_rank,
    };
  });

  tournament.players = playerObject;
  processTournamentSets(tournament);
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

  const grandFinalsCounter = 0;

  const filteredForEmptyScores = tournament.matches.filter((set) => {
    return set.match.scores_csv !== '';
  });

  const filteredForDQSets = filteredForEmptyScores.filter((set) => {
    return set.match.scores_csv.match(/-/g).length === 1;
  });

  tournament.grandFinalsCounter = grandFinalsCounter;
  tournament.matches = filteredForDQSets;
  tournament.rounds = rounds;

  makePlayersObject(tournament);
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

const processTournament = (tournament) => {
  console.log('Processing');
  checkDatabaseForTournament(tournament);
};

module.exports = processTournament;
