'use strict';

const client = require('../client');

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
  const filteredForEnoughAttendance = playerList.filter((player) => {
    return player.attendance > 4;
  });

  const filteredForActivePlayers = filteredForEnoughAttendance.filter((player) => {
    return player.active_attendance > 3;
  });

  const filteredForWashingtonPlayers = filteredForActivePlayers.filter((player) => {
    return player.state === 'WA';
  });

  return filteredForWashingtonPlayers;
};

const allPlayers = (playerList) => {
  const filteredForEnoughAttendance = playerList.filter((player) => {
    return player.attendance > 4;
  });

  return filteredForEnoughAttendance;
};

const getPlayersFromDatabase = () => {
  const playerList = [];
  const playersObject = {};

  return queryDatabase()
    .then((data) => {
      data.rows.forEach((row) => {
        playerList.push(row);
        playersObject[row.name] = row;
      });

      playersObject.activeWashingtonPlayers = activeWashingtonPlayers(playerList);
      playersObject.allPlayers = allPlayers(playerList);

      return playersObject;
    });
};

module.exports = getPlayersFromDatabase;
