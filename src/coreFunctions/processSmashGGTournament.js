'use strict';

const smashGG = require('smashgg.js');

const client = require('../client');
const recalculatePlayerStatistics = require('./recalculatePlayerStatistics');

smashGG.initialize(process.env.SMASHGG_API_KEY);

const storeTournamentInDatabase = (tournamentData) => {
  const { id, name } = tournamentData.tournament;
  const entrants = tournamentData.tournament.numberOfEntrants;
  const url = `https://smash.gg/${tournamentData.eventSlug}`;
  const date = tournamentData.tournament.endTime;

  const placements = {};

  tournamentData.standings.forEach((player) => {
    if (Object.hasOwnProperty.call(placements, player.placement)) {
      placements[player.placement].push(player.entrant.name);
    } else {
      placements[player.placement] = [player.entrant.name];
    }
  });

  JSON.stringify(placements);

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
    $1, $2, $3, $4, $5
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
  console.log('Checking database for the player');
  const noMultipleSpaces = player.entrant.name.replace(/\s{2,}/, '');

  const name = noMultipleSpaces.match(/\w[^|]+$/);
  const sponser = noMultipleSpaces.match(/.*\b(?=.\|)/) || '';

  return client.query('SELECT * FROM players WHERE players.name = $1', [name])
    .then((data) => {
      if (data.rowCount > 0) {
        console.log('Player found in database: Not stored', player.entrant.name);
      }
      if (data.rowCount === 0) {
        const jsonObject = JSON.stringify({});

        console.log('Storing player in database', player.entrant.name, player.entrant.id);
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
          player.entrant.id,
          name,
          sponser,
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

const processTournamentPlayers = (tournamentData) => {
  const promises = tournamentData.standings.map((player) => {
    return checkPlayersForNameAndStoreIfNotFound(player);
  });

  Promise.all(promises)
    .then(() => {
      storeTournamentInDatabase(tournamentData);
    })
    .catch((error) => {
      throw error;
    });
};

const storeSetInDatabase = (set, tournament) => {
  const { id } = set;
  const tournamentid = tournament.id;
  const tournamentName = tournament.name;
  const date = new Date(set.completedAt * 1000);
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
  if (set.score1 < set.score2) {
    winnerName = set.player2.tag;
    winnerScore += set.score2;
    loserName = set.player1.tag;
    loserScore += set.score1;
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
    tournamentid,
    tournamentName,
    winnerScore,
    loserScore,
    date,
  ]);
};

const processTournamentSets = (tournamentData) => {
  console.log('Processing tournament sets', tournamentData.tournament);
  const promises = tournamentData.sets.map((set) => {
    return storeSetInDatabase(set, tournamentData.tournament);
  });

  Promise.all(promises)
    .then(() => {
      processTournamentPlayers(tournamentData);
    })
    .catch((error) => {
      throw error;
    });
};

const filterSetsForTournament = (tournamentData) => {
  console.log('Filtering sets for empty scores');

  const filteredForEmptyScores = tournamentData.sets.filter((set) => {
    return set.score1 !== 0 || set.score2 !== 0;
  });

  tournamentData.sets = filteredForEmptyScores;

  processTournamentSets(tournamentData);
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
        filterSetsForTournament(tournamentData);
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
