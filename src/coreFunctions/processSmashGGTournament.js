'use strict';

const smashGG = require('smashgg.js');

const client = require('../client');
const recalculatePlayerStatistics = require('./recalculatePlayerStatistics');

smashGG.initialize(process.env.SMASHGG_API_KEY);

const storeTournamentInDatabase = (tournamentData, playersObject) => {
  const { id, name } = tournamentData.tournament;
  const entrants = tournamentData.numberOfEntrants;
  const url = `https://smash.gg/${tournamentData.eventSlug}`;
  const date = tournamentData.tournament.endTime;

  const placements = {};

  Object.keys(playersObject).forEach((player) => {
    const playerPlacement = playersObject[player].placement;
    
    const playerName = playersObject[player].sponser === '' ? playersObject[player].name 
      : `${playersObject[player].sponser} | ${playersObject[player].name}`;

    if (Object.hasOwnProperty.call(placements, playerPlacement)) {
      placements[playerPlacement].push(playerName);
    } else {
      placements[playerPlacement] = [playerName];
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

const storeSetInDatabase = (set, tournamentData, playersObject) => {
  const { id } = set;
  const tournamentid = tournamentData.tournament.id;
  const tournamentName = tournamentData.tournament.name;
  const date = new Date(set.completedAt * 1000);
  const round = set.fullRoundText;

  let winner;
  let loser;
  let winnerScore = 0;
  let loserScore = 0;
  
  if (set.score1 > set.score2) {
    winner = playersObject[set.player1.entrantId];
    loser = playersObject[set.player2.entrantId];
    
    winnerScore += set.score1;
    loserScore += set.score2;
  }

  if (set.score1 < set.score2) {
    winner = playersObject[set.player2.entrantId];
    loser = playersObject[set.player1.entrantId];

    winnerScore += set.score2;
    loserScore += set.score1;
  }

  const winnerName = winner.name;
  const winnerSponser = winner.sponser;
  const loserName = loser.name;
  const loserSponser = loser.sponser;
          
  console.log(`Storing set in database Winner: ${winnerSponser} ${winnerName}, Loser: ${loserSponser} ${loserName}`);
  client.query(`INSERT INTO sets 
    (
      id,
      round,
      winner_name,
      winner_sponser,
      winner_score,
      loser_name,
      loser_sponser,
      loser_score,
      tournament_id,
      tournament_name,
      date
      )
      VALUES
      (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
    );`,
  [
    id,
    round,
    winnerName,
    winnerSponser,
    winnerScore,
    loserName,
    loserSponser,
    loserScore,
    tournamentid,
    tournamentName,
    date,
  ]);
};
          
const processTournamentSets = (tournamentData, playersObject) => {
  console.log('Processing tournament sets');
  const promises = tournamentData.sets.map((set) => {
    return storeSetInDatabase(set, tournamentData, playersObject);
  });
          
  Promise.all(promises)
    .then(() => {
      storeTournamentInDatabase(tournamentData, playersObject);
    })
    .catch((error) => {
      throw error;
    });
};

const filterSetsForTournament = (tournamentData, playersObject) => {
  console.log('Filtering sets for empty scores');

  const filteredForEmptyScores = tournamentData.sets.filter((set) => {
    return set.score1 !== 0 || set.score2 !== 0;
  });

  tournamentData.sets = filteredForEmptyScores;

  processTournamentSets(tournamentData, playersObject);
};

const addToPlayersObject = (playersObject, id, name, sponser, placement) => {
  playersObject[id] = {
    id,
    name,
    sponser,
    placement,
  };
};

const checkPlayersForNameAndStoreIfNotFound = (player, playersObject) => {
  console.log('Checking database for the player');
  const { id } = player.entrant;

  const noMultipleSpaces = player.entrant.name.replace(/\s{2,}/, '');

  const [playerName] = noMultipleSpaces.match(/\b[^|]+$/);
  const sponserMatch = noMultipleSpaces.match(/.*\b(?=.\|)/);
  let playerSponser = '';
  
  if (sponserMatch) {
    [playerSponser] = sponserMatch;
  }
  
  return client.query('SELECT name, sponser FROM players WHERE players.name = $1', [playerName])
    .then((data) => {
      if (data.rowCount > 0) {
        console.log('Player found in database: Not stored', playerName);
        const [foundPlayer] = data.rows;
        const { name, sponser } = foundPlayer;

        addToPlayersObject(playersObject, id, name, sponser, player.placement);
      }

      if (data.rowCount === 0) {
        addToPlayersObject(playersObject, id, playerName, playerSponser, player.placement);
        
        const jsonObject = JSON.stringify({});
        
        console.log('Storing player in database', playerName, id);
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
          id,
          playerName,
          playerSponser,
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
  const playersObject = {};
  const promises = tournamentData.standings.map((player) => {
    return checkPlayersForNameAndStoreIfNotFound(player, playersObject);
  });

  Promise.all(promises)
    .then(() => {
      filterSetsForTournament(tournamentData, playersObject);
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
        processTournamentPlayers(tournamentData);
      }
    })
    .catch((error) => {
      throw error;
    });
};

module.exports = checkDatabaseForTournament;
