'use strict';

const client = require('../client');

const storeTournamentInDatabase = (tournament, playersObject) => {
  const { id, name, numberOfSets } = tournament;

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

  const entrants = tournament.participants_count;
  const url = tournament.full_challonge_url;
  const date = tournament.completed_at;

  console.log('Storing tournament');
  client.query(`INSERT INTO tournaments 
  (
    id,
    name,
    number_of_entrants,
    number_of_sets,
    placements,
    url,
    date
  ) 
  VALUES 
  (
    $1, $2, $3, $4, $5, $6, $7
  );`,
  [
    id,
    name,
    entrants,
    numberOfSets,
    placements,
    url,
    date,
  ]);
};

const storeSetInDatabase = (set, tournament, playersObject) => {
  const { id } = set;
  const tournamentId = tournament.id;
  const tournamentName = tournament.name;
  const date = set.completed_at;
  const splitScores = set.scores_csv.split('');
  
  let round = '';

  const winner = playersObject[set.winner_id];
  const loser = playersObject[set.loser_id];
  
  const winnerName = winner.name;
  const winnerSponser = winner.sponser;
  const loserName = loser.name;
  const loserSponser = loser.sponser;
  
  let winnerScore = 0;
  let loserScore = 0;

  if (set.round > 0) {
    round = `Winners Round ${Math.abs(set.round)}`;
  }
  if (set.round < 0) {
    round = `Losers Round ${Math.abs(set.round)}`;
  }
  if (set.round === tournament.rounds[1] + 2) {
    round = 'Losers Quarter-final';
  }
  if (set.round === tournament.rounds[1] + 1) {
    round = 'Losers Semi-final';
  }
  if (set.round === tournament.rounds[1]) {
    round = 'Losers Final';
  }
  if (set.round === tournament.rounds[0] - 3 && tournament.rounds[0] > 5) {
    round = 'Winners Quarter-final';
  }
  if (set.round === tournament.rounds[0] - 2) {
    round = 'Winners Semi-final';
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
    tournamentId,
    tournamentName,
    date,
  ]);
};

const processTournamentSets = (tournament, playersObject) => {
  const promises = tournament.matches.map((set) => {
    return storeSetInDatabase(set.match, tournament, playersObject);
  });

  Promise.all(promises)
    .then(() => {
      storeTournamentInDatabase(tournament, playersObject);
    })
    .catch((error) => {
      throw error;
    });
};

const filterSetsForTournament = (tournament, playersObject) => {
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
  tournament.numberOfSets = filteredForDQSets.length;
  tournament.rounds = rounds;

  processTournamentSets(tournament, playersObject);
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
  console.log('Checking database for player');

  const noMultipleSpaces = player.name.replace(/\s{2,}/, '');

  const [playerName] = noMultipleSpaces.match(/\b[^|]+$/);
  const sponserMatch = noMultipleSpaces.match(/.*\b(?=.\|)/);

  let playerSponser = '';

  if (sponserMatch) {
    [playerSponser] = sponserMatch;
  }

  return client.query('SELECT name, sponser FROM players WHERE UPPER(players.name) = UPPER($1);', [playerName])
    .then((data) => {
      if (data.rowCount > 0) {
        console.log('Player found in database: Not stored', playerName);
        const [foundPlayer] = data.rows;
        const { name, sponser } = foundPlayer;

        addToPlayersObject(playersObject, player.id, name, sponser, player.final_rank);
      }

      if (data.rowCount === 0) {
        addToPlayersObject(playersObject, player.id, playerName, playerSponser, player.final_rank);

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

const processTournamentPlayers = (tournament) => {
  const playersObject = {};
  const promises = tournament.participants.map((player) => {
    return checkPlayersForNameAndStoreIfNotFound(player.participant, playersObject);
  });

  Promise.all(promises)
    .then(() => {
      console.log('store tournament');
      filterSetsForTournament(tournament, playersObject);
    })
    .catch((error) => {
      throw error;
    });
};

const checkDatabaseForTournament = (tournament) => {
  console.log('Checking database for tournament');
  return client.query(`SELECT name FROM tournaments WHERE id = ${tournament.id};`)
    .then((data) => {
      if (data.rowCount > 0) {
        console.log('Tournament found in database: Not stored');
      }
      if (data.rowCount === 0) {
        processTournamentPlayers(tournament);
      }
    })
    .catch((error) => {
      throw error;
    });
};

module.exports = checkDatabaseForTournament;
