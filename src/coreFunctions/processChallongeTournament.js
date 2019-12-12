'use strict';

const client = require('../client');

const storeTournamentInDatabase = (tournament, playersObject) => {
  const { id, name, numberOfSets } = tournament;

  const placements = {};
  
  Object.keys(playersObject).forEach((player) => {
    if (playersObject[player].setsPlayed !== 0) {
      const playerPlacement = playersObject[player].placement;
      
      if (playerPlacement) {
        const playerName = playersObject[player].sponser === '' ? playersObject[player].name 
          : `${playersObject[player].sponser} | ${playersObject[player].name}`;
        
        if (Object.hasOwnProperty.call(placements, playerPlacement)) {
          placements[playerPlacement].push(playerName);
        } else {
          placements[playerPlacement] = [playerName];
        }
      }
    }
  });

  JSON.stringify(placements);

  const entrants = tournament.participants_count;
  const url = tournament.full_challonge_url;
  const date = tournament.completed_at ? tournament.completed_at : tournament.started_at;

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
  const { rounds } = tournament;
  const date = set.completed_at;
  const splitScores = set.scores_csv.split('');
  
  let round = '';
  let mainBracket = true;

  if (!set.winner_id || !set.loser_id) {
    return null;
  }

  let winner = playersObject[set.winner_id];
  let loser = playersObject[set.loser_id];

  if (!winner && !loser) {
    Object.keys(playersObject).forEach((key) => {
      if (playersObject[key].groupIDs.includes(set.winner_id)) {
        winner = playersObject[key];
        mainBracket = false;
      }
      if (playersObject[key].groupIDs.includes(set.loser_id)) {
        loser = playersObject[key];
        mainBracket = false;
      }
    });
  }

  winner.setsPlayed += 1;
  loser.setsPlayed += 1;
  
  const winnerName = winner.name;
  const winnerSponser = winner.sponser;
  const loserName = loser.name;
  const loserSponser = loser.sponser;
  
  let winnerScore = 0;
  let loserScore = 0;

  if (set.round > 0 && mainBracket) {
    round = `Winners Round ${Math.abs(set.round)}`;
  }
  if (set.round < 0 && mainBracket) {
    round = `Losers Round ${Math.abs(set.round)}`;
  }
  if (set.round === rounds[1] + 2 && mainBracket) {
    round = 'Losers Quarter-final';
  }
  if (set.round === rounds[1] + 1 && mainBracket) {
    round = 'Losers Semi-final';
  }
  if (set.round === rounds[1] && mainBracket) {
    round = 'Losers Final';
  }
  if (set.round === rounds[0] - 3 && rounds[0] > 5 && mainBracket) {
    round = 'Winners Quarter-final';
  }
  if (set.round === rounds[0] - 2 && mainBracket) {
    round = 'Winners Semi-final';
  }
  if (set.round === rounds[0] - 1 && mainBracket) {
    round = 'Winners Final';
  }
  if (set.round === rounds[0] && mainBracket) {
    tournament.grandFinalsCounter += 1;
    round = 'Grand Final';
  }
  if (set.round === rounds[0] && tournament.grandFinalsCounter === 2 && mainBracket) {
    round = 'Grand Final Reset';
  }
  if (!mainBracket) {
    round = `Round ${set.round}`;
  }
  if (tournament.tournament_type === 'round robin') {
    round = 'Round Robin';
  }
  if (tournament.tournament_type === 'swiss') {
    round = `Round ${set.round}`;
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
  return client.query(`INSERT INTO sets 
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

const addToPlayersObject = (playersObject, player, name, sponser) => {
  playersObject[player.id] = {
    id: player.id,
    name,
    sponser,
    placement: player.final_rank,
    setsPlayed: 0,
    groupIDs: player.group_player_ids ? [...player.group_player_ids] : [],
  };
};

const checkPlayersForNameAndStoreIfNotFound = (player, playersObject) => {
  console.log('Checking database for player');

  const noMultipleSpaces = player.name.replace(/\s{2,}/, '');

  const splitName = noMultipleSpaces.split(' | ');

  let playerName = '';
  let playerSponser = '';

  if (splitName.length === 1) {
    [playerName] = splitName;
  }
  if (splitName.length === 2) {
    [playerSponser, playerName] = splitName;
  }
  if (splitName.length > 2) {
    playerName = splitName[splitName.length - 1];
    const sponser = [...splitName];
    sponser.pop();
    playerSponser = sponser.join(' | ');
  }

  return client.query('SELECT name, sponser FROM players WHERE UPPER(players.name) = UPPER($1);', [playerName])
    .then((data) => {
      if (data.rowCount > 0) {
        console.log('Player found in database: Not stored', playerName);
        const [foundPlayer] = data.rows;
        const { name, sponser } = foundPlayer;

        addToPlayersObject(playersObject, player, name, sponser);
      }

      if (data.rowCount === 0) {
        addToPlayersObject(playersObject, player, playerName, playerSponser);

        const jsonObject = JSON.stringify({});

        console.log('Storing player in database', playerName, player.id);
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
