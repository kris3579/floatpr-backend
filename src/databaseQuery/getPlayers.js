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
      playerObject.washingtonPlayers = washingtonPlayers(playerList);
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

  const filteredForWashingtonPlayers = washingtonPlayers(filteredForActivity);

  return filteredForWashingtonPlayers;
};

const washingtonPlayers = (playerList) => {
  const filteredForWashingtonPlayers = playerList.filter((player) => {
    return player.state === 'WA';
  });

  return filteredForWashingtonPlayers;
};

const filterInactivePlayers = (playerList) => {
  const filteredForEnoughAttendance = playerList.filter((player) => {
    return player.attendance > 4;
  });

  const filteredForActivePlayers = filteredForEnoughAttendance.filter((player) => {
    return player.active_attendance > 1;
  });

  return filteredForActivePlayers;
};

module.exports = getPlayersFromDatabase;