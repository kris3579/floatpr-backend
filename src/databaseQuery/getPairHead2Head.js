'use strict';

const client = require('../client');

const queryDatabase = (player1, player2) => {
  return client.query('SELECT * FROM sets WHERE winner_name = $1 AND loser_name = $2 OR winner_name = $2 AND loser_name = $1 ORDER BY date DESC;', [player1, player2])
    .then((data) => {
      return data;
    })
    .catch((error) => {
      throw error;
    });
};

const calculateWinRates = (player1Score, player2Score) => {
  let player1WinRate = ((player1Score / (player1Score + player2Score)) * 100);
  let player2WinRate = ((player2Score / (player2Score + player1Score)) * 100);

  if (Number.isInteger(player1WinRate) === false) {
    player1WinRate = `${player1WinRate.toFixed(2)}%`;
  }
  if (Number.isInteger(player2WinRate) === false) {
    player2WinRate = `${player2WinRate.toFixed(2)}%`;
  }
  if (Number.isInteger(player1WinRate) === true) {
    player1WinRate = `${player1WinRate}%`;
  }
  if (Number.isInteger(player2WinRate) === true) {
    player2WinRate = `${player2WinRate}%`;
  }

  return [player1WinRate, player2WinRate];
};

const getPairHead2Head = (player1, player2) => {
  const h2HObject = {
    matchupName: `${player1} vs ${player2}`,
    player1,
    player2,
    setsPlayed: 0,
    setsArray: [],
    setScore: [0, 0],
    setAvg: ['100%', '100%'],
    gamesPlayed: 0,
    gameScore: [0, 0],
    gameAvg: ['100%', '100%'],
  };

  return queryDatabase(player1, player2)
    .then((sets) => {
      sets.rows.forEach((set) => {
        h2HObject.setsPlayed += 1;
        h2HObject.gamesPlayed += set.winner_score;
        h2HObject.gamesPlayed += set.loser_score;

        h2HObject.setsArray.push(set);

        if (set.winner_name === player1) {
          h2HObject.setScore[0] += 1;
          h2HObject.gameScore[0] += set.winner_score;
          h2HObject.gameScore[1] += set.loser_score;
        }
        if (set.winner_name === player2) {
          h2HObject.setScore[1] += 1;
          h2HObject.gameScore[0] += set.loser_score;
          h2HObject.gameScore[1] += set.winner_score;
        }

        h2HObject.setAvg = calculateWinRates(h2HObject.setScore[0], h2HObject.setScore[1]);
        h2HObject.gameAvg = calculateWinRates(h2HObject.gameScore[0], h2HObject.gameScore[1]);
      });

      return h2HObject;
    });
};

module.exports = getPairHead2Head;
