'use strict';

const client = require('../client');

const getPairHead2Head = (player1, player2) => {
  const head2HeadObject = {
    matchupName: `${player1} vs ${player2}`,
    player1: player1,
    player2: player2,
    setsPlayed: 0,
    setsArray: [],
    setScore: [0, 0],
    setPercentages: ['100%', '100%'],
    gamesPlayed: 0,
    gameScore: [0, 0],
    gamePercentages: ['100%', '100%'],
  };

  return queryDatabase(player1, player2)
    .then((sets) => {
      sets.rows.forEach((set) => {
        head2HeadObject.setsPlayed += 1;
        head2HeadObject.gamesPlayed += set.winner_score;
        head2HeadObject.gamesPlayed += set.loser_score;

        head2HeadObject.setsArray.push(set);

        if(set.winner_name === player1) {
          head2HeadObject.setScore[0] += 1;
          head2HeadObject.gameScore[0] += set.winner_score;
          head2HeadObject.gameScore[1] += set.loser_score;
        }
        if(set.winner_name === player2) {
          head2HeadObject.setScore[1] += 1;
          head2HeadObject.gameScore[0] += set.loser_score;
          head2HeadObject.gameScore[1] += set.winner_score;
        }

        head2HeadObject.setPercentages = calculateWinRates(head2HeadObject.setScore[0], head2HeadObject.setScore[1]);
        head2HeadObject.gamePercentages = calculateWinRates(head2HeadObject.gameScore[0], head2HeadObject.gameScore[1]);
      });

      return head2HeadObject;
    });
};

const queryDatabase = (player1, player2) => {
  return client.query(`SELECT * FROM sets WHERE winner_name = $1 AND loser_name = $2 OR winner_name = $2 AND loser_name = $1 ORDER BY date DESC;`, [player1, player2])
    .then((data) => {
      return data;
    })
    .catch((error) => {
      throw error;
    });
};

const calculateWinRates = (player1Score, player2Score) => {

  const player1WinRate = `${(((player1Score / (player1Score + player2Score)).toFixed(2)) * 100)}%`;
  const player2WinRate = `${(((player2Score / (player2Score + player1Score)).toFixed(2)) * 100)}%`;

  return [player1WinRate, player2WinRate];
};

module.exports = getPairHead2Head;