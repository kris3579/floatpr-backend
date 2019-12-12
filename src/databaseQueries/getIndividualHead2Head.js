'use strict';

const client = require('../client');

const sortBySetsPlayed = (matchups) => {
  const matchupObject = {
    allMatchups: [],
    mostPlayed: [],
    lessPlayed: [],
  };

  Object.keys(matchups).sort((a, b) => {
    const mA = matchups[a];
    const mB = matchups[b];

    if (mA.setsPlayed === mB.setsPlayed && mA.setAvg[0] === mB.setAvg[0]) {
      return mB.gamesPlayed - mA.gamesPlayed;
    }

    if (mA.setsPlayed === mB.setsPlayed) {
      return mB.setAvg[0] - mA.setAvg[0];
    }

    return mB.setsPlayed - mA.setsPlayed;
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

const queryDatabase = (player) => {
  return client.query('SELECT * FROM sets WHERE winner_name = $1 OR loser_name = $1 ORDER BY date DESC;', [player])
    .then((data) => {
      return data;
    })
    .catch((error) => {
      throw error;
    });
};

const addToMatchupObject = (winner, loser, position, allMatchups, set) => {
  const matchupName = position === 'winner' ? `${winner} vs ${loser}` : `${loser} vs ${winner}`;
  const matchup = allMatchups[matchupName];

  if (matchup) {
    matchup.setsPlayed += 1;
    matchup.gamesPlayed += set.winner_score + set.loser_score;

    if (position === 'winner') {
      matchup.setScore[0] += 1;
      matchup.gameScore[0] += set.winner_score;
      matchup.gameScore[1] += set.loser_score;
    }
    if (position === 'loser') {
      matchup.setScore[1] += 1;
      matchup.gameScore[0] += set.loser_score;
      matchup.gameScore[1] += set.winner_score;
    }
  }

  if (!matchup) {
    const newMatchup = {};
    newMatchup.name = matchupName;
    newMatchup.setsPlayed = 1;
    newMatchup.setAvg = [];
    newMatchup.gamesPlayed = set.winner_score + set.loser_score;
    newMatchup.gameAvg = [];

    if (position === 'winner') {
      newMatchup.opponent = loser;
      newMatchup.setScore = [1, 0];
      newMatchup.gameScore = [set.winner_score, set.loser_score];
    }
    if (position === 'loser') {
      newMatchup.opponent = winner;
      newMatchup.setScore = [0, 1];
      newMatchup.gameScore = [set.loser_score, set.winner_score];
    }
    
    allMatchups[matchupName] = newMatchup;
  }
};

const getIndividualHead2Head = (player) => {
  const allMatchups = {};

  return queryDatabase(player)
    .then((sets) => {
      sets.rows.forEach((set) => {
        const setWinner = set.winner_sponser === '' ? set.winner_name : `${set.winner_sponser} | ${set.winner_name}`;
        const setLoser = set.loser_sponser === '' ? set.loser_name : `${set.loser_sponser} | ${set.loser_name}`;

        if (set.winner_name === player) {
          addToMatchupObject(setWinner, setLoser, 'winner', allMatchups, set);
        }
        if (set.loser_name === player) {
          addToMatchupObject(setWinner, setLoser, 'loser', allMatchups, set);
        }
      });

      Object.keys(allMatchups).forEach((matchupName) => {
        const matchup = allMatchups[matchupName];

        matchup.setAvg = calculateWinRates(matchup.setScore[0], matchup.setScore[1]);
        matchup.gameAvg = calculateWinRates(matchup.gameScore[0], matchup.gameScore[1]);
      });

      const sortedMatchups = sortBySetsPlayed(allMatchups);
      return sortedMatchups;
    });
};

module.exports = getIndividualHead2Head;
