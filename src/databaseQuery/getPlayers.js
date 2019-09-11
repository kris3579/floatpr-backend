'use strict';

const client = require('../client');

const getPlayersFromDatabase = () => {
  const playerList = [];
  const playerObject = {};

  return queryDatabase()
    .then((data) => {
      data.rows.forEach((row) => {
        playerList.push(row);
        playerObject[row.name] = row;
      });

      playerObject.activeWashingtonPlayers = activeWashingtonPlayers(playerList);
      playerObject.allActivePlayers = allActivePlayers(playerList);
      playerObject.allPlayers = playerList;

      return playerObject;
    });
};

const queryDatabase = () => {
  return client.query('SELECT * FROM players ORDER BY rating DESC, set_win_rate DESC, game_win_rate DESC;')
    .then((data) => {
      return data;
    })
    .catch((error) => {
      throw error;
    });
};

const activeWashingtonPlayers = (playerList) => {
  const filteredForActivity = filterInactivePlayers(playerList);

  const filteredForWashingtonPlayers = filteredForActivity.filter((player) => {
    return player.state === 'WA';
  });

  return filteredForWashingtonPlayers;
};

const allActivePlayers = (playerList) => {
  const filteredForActivity = filterInactivePlayers(playerList);

  return filteredForActivity;
};

const filterInactivePlayers = (playerList) => {
  const filteredForActivePlayers = playerList.filter((player) => {
    return player.active_attendance > 1;
  });

  return filteredForActivePlayers;
};

module.exports = getPlayersFromDatabase;