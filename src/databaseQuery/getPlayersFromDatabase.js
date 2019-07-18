'use strict';

const client = require('../client');

const getPlayersFromDatabase = () => {
  const playerObject = {};
  const playerList = [];

  return queryDatabase()
    .then((data) => {
      data.rows.forEach((row) => {
        playerObject[row.name] = row;
        playerList.push(row);
      });

      playerObject.activeWashingtonPlayers = activeWashingtonPlayers(playerList);
      playerObject.allActivePlayers = allActivePlayers(playerList);
      playerObject.allPlayers = playerList;
      playerObject.outOfStatePlayers = outOfStatePlayers(playerList);

      return playerObject;
    });
};

const queryDatabase = () => {
  return client.query('SELECT * FROM players ORDER BY rating DESC;')
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
    player.state === 'WA';
  });
  const rankedList = rankPlayers(filteredForWashingtonPlayers);
  return rankedList;
};

const allActivePlayers = (playerList) => {
  const filteredForActivity = filterInactivePlayers(playerList);

  const rankedList = rankPlayers(filteredForActivity);
  return rankedList;
};

const outOfStatePlayers = (playerList) => {
  const filteredForOutOfStatePlayers =  playerList.filter((player) => {
    player.state !== 'WA';
  });

  const rankedList = rankPlayers(filteredForOutOfStatePlayers);
  return rankedList;
};

const filterInactivePlayers = (playerList) => {
  const filteredForActivePlayers =  playerList.filter((player) => {
    player.activeAttendance > 1;
  });

  const rankedList = rankPlayers(filteredForActivePlayers);
  return rankedList;
};

const rankPlayers = (playerList) => {
  let rankCounter = 1;

  return playerList.map((player) => {
    player.rank = rankCounter;
    rankCounter++;
  });
};

module.exports = getPlayersFromDatabase;