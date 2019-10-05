'use strict';

const client = require('../client');

const queryDatabaseForTopPlayers = () => {
  return client.query('SELECT * FROM players WHERE state = \'WA\' AND active_attendance > 1 ORDER BY rating DESC LIMIT 10;')
    .then((data) => {
      return data.rows;
    })
    .catch((error) => {
      throw error;
    });
};

const queryDatabaseForTopPlayerSets = (playersArray) => {
  return client.query('SELECT * FROM sets WHERE winner_name in ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) AND loser_name in ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);', [playersArray[0].name, playersArray[1].name, playersArray[2].name, playersArray[3].name, playersArray[4].name, playersArray[5].name, playersArray[6].name, playersArray[7].name, playersArray[8].name, playersArray[9].name])
    .then((data) => {
      return data.rows;
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

const getTopPlayerHead2Head = () => {
  const topPlayerHead2HeadObject = {};
  const playersArray = [];

  return queryDatabaseForTopPlayers()
    .then((players) => {
      players.forEach((player, i) => {
        player.rank = i + 1;
        playersArray.push(player);
      });

      topPlayerHead2HeadObject.rankingOrder = playersArray;

      const matchupsArray = ['1-2', '1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '1-8', '1-9', '1-10', '2-3', '2-4', '2-5', '2-6', '2-7', '2-8', '2-9', '2-10', '3-4', '3-5', '3-6', '3-7', '3-8', '3-9', '3-10', '4-5', '4-6', '4-7', '4-8', '4-9', '4-10', '5-6', '5-7', '5-8', '5-9', '5-10', '6-7', '6-8', '6-9', '6-10', '7-8', '7-9', '7-10', '8-9', '8-10', '9-10'];
      matchupsArray.forEach((matchup) => {
        topPlayerHead2HeadObject[matchup] = {
          setScore: [0, 0],
          setPercentages: ['N/A', 'N/A'],
          gameScore: [0, 0],
          gamePercentages: ['N/A', 'N/A'],
        };
      });

      return queryDatabaseForTopPlayerSets(playersArray)
        .then((sets) => {
          sets.forEach((set) => {
            let winnerRank = 0;
            let loserRank = 0;

            for (let i = 0; i < playersArray.length; i++) {
              if (playersArray[i].name === set.winner_name) {
                winnerRank += playersArray[i].rank;
              }
              if (playersArray[i].name === set.loser_name) {
                loserRank += playersArray[i].rank;
              }
            }

            let matchupRanks = '';
            if (winnerRank < loserRank) {
              matchupRanks = `${winnerRank}-${loserRank}`;
            }
            if (winnerRank > loserRank) {
              matchupRanks = `${loserRank}-${winnerRank}`;
            }

            if (winnerRank > loserRank) {
              topPlayerHead2HeadObject[matchupRanks].setScore[0] += 1;
              topPlayerHead2HeadObject[matchupRanks].gameScore[0] += set.winner_score;
              topPlayerHead2HeadObject[matchupRanks].gameScore[1] += set.loser_score;
            }
            if (loserRank > winnerRank) {
              topPlayerHead2HeadObject[matchupRanks].setScore[1] += 1;
              topPlayerHead2HeadObject[matchupRanks].gameScore[0] += set.loser_score;
              topPlayerHead2HeadObject[matchupRanks].gameScore[1] += set.winner_score;
            }

            topPlayerHead2HeadObject[matchupRanks].setPercentages = calculateWinRates(topPlayerHead2HeadObject[matchupRanks].setScore[0], topPlayerHead2HeadObject[matchupRanks].setScore[1]);
            topPlayerHead2HeadObject[matchupRanks].gamePercentages = calculateWinRates(topPlayerHead2HeadObject[matchupRanks].gameScore[0], topPlayerHead2HeadObject[matchupRanks].gameScore[1]);
          });

          return topPlayerHead2HeadObject;
        });
    });
};

module.exports = getTopPlayerHead2Head;
