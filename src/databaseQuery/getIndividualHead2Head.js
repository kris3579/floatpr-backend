'use strict';

const client = require('../client');

const queryDatabase = (player) => {
  return client.query('SELECT * FROM sets WHERE winner_name = $1 OR loser_name = $1 ORDER BY date DESC;', [player])
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

const sortBySetsPlayed = (matchups) => {
  const matchupObject = {
    allMatchups: [],
    mostPlayed: [],
    lessPlayed: [],
  };

  Object.keys(matchups).sort((a, b) => {
    return matchups[b].setsPlayed - matchups[a].setsPlayed;
  })
    .forEach((key) => {
      matchupObject.allMatchups.push(matchups[key]);
    });

  matchupObject.allMatchups.forEach((matchup, i) => {
    if (i < 5) {
      matchupObject.mostPlayed.push(matchup);
    } else {
      matchupObject.lessPlayed.push(matchup);
    }
  });

  return matchupObject;
};

const getIndividualHead2Head = (player) => {
  const allMatchups = {};

  return queryDatabase(player)
    .then((sets) => {
      sets.rows.forEach((set) => {
        if (set.winner_name === player) {
          const matchupName = `${player} vs ${set.loser_name}`;
          let matchup = allMatchups[matchupName];

          if (Object.hasOwnProperty.call(allMatchups, matchupName) === false) {
            matchup = {
              name: matchupName,
              opponent: set.loser_name,
              setsPlayed: 1,
              setScore: [1, 0],
              setAvg: ['100%', '0%'],
              gameScore: [set.winner_score, set.loser_score],
              gameAvg: calculateWinRates(set.winner_score, set.loser_score),
            };
          } else {
            matchup.setsPlayed += 1;
            matchup.setScore[0] += 1;
            matchup.setAvg = calculateWinRates(matchup.setScore[0], matchup.setScore[1]);
            matchup.gameScore[0] += set.winner_score;
            matchup.gameScore[1] += set.loser_score;
            matchup.gameAvg = calculateWinRates(matchup.gameScore[0], matchup.gameScore[1]);
          }
        }

        if (set.loser_name === player) {
          const matchupName = `${player} vs ${set.winner_name}`;
          let matchup = allMatchups[matchupName];

          if (Object.hasOwnProperty.call(allMatchups, matchupName) === false) {
            matchup = {
              name: matchupName,
              opponent: set.winner_name,
              setsPlayed: 1,
              setScore: [0, 1],
              setAvg: ['0%', '100%'],
              gameScore: [set.loser_score, set.winner_score],
              gameAvg: calculateWinRates(set.loser_score, set.winner_score),
            };
          } else {
            matchup.setsPlayed += 1;
            matchup.setScore[1] += 1;
            matchup.setAvg = calculateWinRates(matchup.setScore[0], matchup.setScore[1]);
            matchup.gameScore[0] += set.loser_score;
            matchup.gameScore[1] += set.winner_score;
            matchup.gameAvg = calculateWinRates(matchup.gameScore[0], matchup.gameScore[1]);
          }
        }
      });

      const sortedMatchups = sortBySetsPlayed(allMatchups);

      return sortedMatchups;
    });
};

module.exports = getIndividualHead2Head;
