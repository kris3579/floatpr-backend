'use strict';

const client = require('../client');

const calculateWinRates = (player1Score, player2Score) => {
  let player1WinRate = ((player1Score / (player1Score + player2Score)) * 100);
  let player2WinRate = ((player2Score / (player2Score + player1Score)) * 100);

  if (Number.isInteger(player1WinRate) === false) {
    player1WinRate = player1WinRate.toFixed(2);
  }
  if (Number.isInteger(player2WinRate) === false) {
    player2WinRate = player2WinRate.toFixed(2);
  }

  return [player1WinRate, player2WinRate];
};

const queryDatabase = (player1, player2) => {
  return client.query('SELECT * FROM sets WHERE winner_name = $1 AND loser_name = $2 OR winner_name = $2 AND loser_name = $1 ORDER BY date DESC;', [player1, player2])
    .then((data) => {
      return data;
    })
    .catch((error) => {
      throw error;
    });
};

const addToMatchupObject = (h2HObject, set, winner, loser) => {
  h2HObject.setsPlayed += 1;
  h2HObject.gamesPlayed += set.winner_score + set.loser_score;
  
  h2HObject.setsArray.push(set);

  h2HObject.setScore[winner] += 1;
  h2HObject.gameScore[winner] += set.winner_score;
  h2HObject.gameScore[loser] += set.loser_score;
};

const getPairHead2Head = (player1, player2) => {
  const player1Tag = player1.split(' | ');
  const player2Tag = player2.split(' | ');

  let [player1Name] = player1Tag;
  let [player2Name] = player2Tag;

  if (player1Tag.length === 2) {
    // eslint-disable-next-line prefer-destructuring
    player1Name = player1Tag[1];
  }
  if (player2Tag.length === 2) {
    // eslint-disable-next-line prefer-destructuring
    player2Name = player2Tag[1];
  }
  
  const h2HObject = {
    matchupName: '',
    player1: '',
    player2: '',
    setsPlayed: 0,
    setsArray: [],
    setScore: [0, 0],
    setAvg: [],
    gamesPlayed: 0,
    gameScore: [0, 0],
    gameAvg: [],
  };

  return queryDatabase(player1Name, player2Name)
    .then((sets) => {
      if (sets.rows.length === 0) {
        return null;
      }
   
      sets.rows.forEach((set, i) => {
        if (set.winner_name === player1Name) {
          if (i === sets.rows.length - 1) {
            const p1DisplayName = set.winner_sponser === '' ? set.winner_name : `${set.winner_sponser} | ${set.winner_name}`;
            const p2DisplayName = set.loser_sponser === '' ? set.loser_name : `${set.loser_sponser} | ${set.loser_name}`;
            h2HObject.matchupName = `${p1DisplayName} vs ${p2DisplayName}`;
            h2HObject.player1 = p1DisplayName;
            h2HObject.player2 = p2DisplayName;
          }

          addToMatchupObject(h2HObject, set, 0, 1);
        }

        if (set.winner_name === player2Name) {
          if (i === sets.rows.length - 1) {
            const p1DisplayName = set.loser_sponser === '' ? set.loser_name : `${set.loser_sponser} | ${set.loser_name}`;
            const p2DisplayName = set.winner_sponser === '' ? set.winner_name : `${set.winner_sponser} | ${set.winner_name}`;
            h2HObject.matchupName = `${p1DisplayName} vs ${p2DisplayName}`;
            h2HObject.player1 = p1DisplayName;
            h2HObject.player2 = p2DisplayName;
          }

          addToMatchupObject(h2HObject, set, 1, 0);
        }

        h2HObject.setAvg = calculateWinRates(h2HObject.setScore[0], h2HObject.setScore[1]);
        h2HObject.gameAvg = calculateWinRates(h2HObject.gameScore[0], h2HObject.gameScore[1]);
      });

      return h2HObject;
    })
    .catch((error) => {
      return error;
    });
};

module.exports = getPairHead2Head;
