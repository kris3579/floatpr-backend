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

const activeWashingtonPlayers = (playerList) => {
  const filteredForActivity = filterInactivePlayers(playerList);

  const filteredForWashingtonPlayers = washingtonPlayers(filteredForActivity);

  return filteredForWashingtonPlayers;
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
      playersObject.washingtonPlayers = washingtonPlayers(playerList);
      playersObject.allPlayers = playerList;

      return playersObject;
    });
};

module.exports = getPlayersFromDatabase;
