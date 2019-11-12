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

const getPairHead2Head = (player1, player2) => {
  const player1Name = player1.match(/\b[^|]+$/);
  const player2Name = player2.match(/\b[^|]+$/);
  
  return queryDatabase(player1Name[0], player2Name[0])
    .then((sets) => {
      if (sets.rows.length === 0) {
        return null;
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
    
      sets.rows.forEach((set, i) => {
        h2HObject.setsPlayed += 1;
        h2HObject.gamesPlayed += set.winner_score;
        h2HObject.gamesPlayed += set.loser_score;
        
        h2HObject.setsArray.push(set);

        if (set.winner_name === player1) {
          h2HObject.setScore[0] += 1;
          h2HObject.gameScore[0] += set.winner_score;
          h2HObject.gameScore[1] += set.loser_score;

          if (i === sets.rows.length - 1) {
            const p1DisplayName = set.winner_sponser === '' ? set.winner_name : `${set.winner_sponser} | ${set.winner_name}`;
            const p2DisplayName = set.loser_sponser === '' ? set.loser_name : `${set.loser_sponser} | ${set.loser_name}`;
            h2HObject.matchupName = `${p1DisplayName} vs ${p2DisplayName}`;
            h2HObject.player1 = p1DisplayName;
            h2HObject.player2 = p2DisplayName;
          }
        }

        if (set.winner_name === player2) {
          h2HObject.setScore[1] += 1;
          h2HObject.gameScore[0] += set.loser_score;
          h2HObject.gameScore[1] += set.winner_score;

          if (i === sets.rows.length - 1) {
            const p1DisplayName = set.loser_sponser === '' ? set.loser_name : `${set.loser_sponser} | ${set.loser_name}`;
            const p2DisplayName = set.winner_sponser === '' ? set.winner_name : `${set.winner_sponser} | ${set.winner_name}`;
            h2HObject.matchupName = `${p1DisplayName} vs ${p2DisplayName}`;
            h2HObject.player1 = p1DisplayName;
            h2HObject.player2 = p2DisplayName;
          }
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
