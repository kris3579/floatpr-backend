'use strict';

const recalculatePlayerStatistics = (matches) => {
  matches.forEach((match) => {
    const winnerId = match.winner_id;
    const loserId = match.loser_id;

    editPlayerStatistics(winnerId, loserId);
  });
};

const editPlayerStatistics = (winnerId, loserId) => {
  const winner = getPlayerInfo(winnerId);
  // const loser = getPlayerInfo(loserId);

  console.log(winner);

  // const newRatings = calculateNewratings(winner, loser);

  // const newWinnerWinRate = calculateNewWinRate(winner.wins + 1, winner.losses);
  // const newLoserWinRate = calculateNewWinRate(loser.wins, loser.losses + 1);

  // const newWinnerRatingHistory = addToRatingHistory(winner.ratingHistory, newRatings.winningPlayer.rating);
  // const newLoserRatingHistory = addToRatingHistory(loser.ratingHistory, newRatings.losingPlayer.rating);

  // const newWinnerWinRateHistory = addToWinRateHistory(winner.winRateHistory, newWinnerWinRate);
  // const newLoserWinRateHistory = addToWinRateHistory(loser.winRateHistory, newLoserWinRate);

  // updateWinnerInfoInDatabase(winnerId, winner.wins + 1, newWinnerWinRate, newRatings.winningPlayer, winner.attendance + 1, newWinnerRatingHistory, newWinnerWinRateHistory);
  // updateLoserInfoInDatabase(loserId, loser.losses + 1, newLoserWinRate, newRatings.losingPlayer, loser.attendance + 1, newLoserRatingHistory, newLoserWinRateHistory);
};

const getPlayerInfo = (playerId) => {
  const playerObject = {};
  console.log('Querying the database for the player\'s info using the playerId');
  client.query(`SELECT * FROM players WHERE id = ${playerId}`)
    .then((data) => {
      console.log(data);
      // playerObject.previousrating = data.rating;
      // playerObject.wins = data.wins;
      // playerObject.losses = data.losses;
      // playerObject.winRate = data.winRate;
      // playerObject.attendance = data.attendance;
      // playerObject.ratingHistory = data.ratingHistory;
      // playerObject.winRateHistory = data.winRateHistory;
    })
    .catch((error) => {
      throw error;
    });

  return playerObject;
};

const calculateNewratings = (winner, loser) => {
  console.log('Calculating new rating for winner');

  const winningPlayer = new Player({
    rating: winner.rating,
    ratingDeviation: winner.ratingDev,
    tau: 0.7,
    volatility: winner.volatility,
  });

  const losingPlayer = new Player({
    rating: loser.rating,
    ratingDeviation: loser.ratingDev,
    tau: 0.7,
    volatility: loser.volatility,
  });

  winningPlayer.addResult(losingPlayer, Outcome.Win);
  losingPlayer.addResult(winningPlayer, Outcome.Loss);

  winningPlayer.updateRating();
  losingPlayer.updateRating();
  console.log(winningPlayer, losingPlayer);

  return {winningPlayer, losingPlayer};
};

const calculateNewWinRate = (wins, losses) => {
  console.log('Caluclating new win rate for player');
  const newWinRate = Math.round(((wins / (wins + losses)) * 100) * 100) / 100;
  return newWinRate;
};

const addToRatingHistory = (previousHistory, newRating) => {
  return [...previousHistory].push(newRating);
};

const addToWinRateHistory = (previousHistory, newWinRate) => {
  return [...previousHistory].push(newWinRate);
};

const updateWinnerInfoInDatabase = (playerId, newWins, newWinRate, winningPlayer, attendance, newRatingHistory, newWinRateHistory) => {
  console.log('Updating wins, winRate, rating, attendance, ratingDev and volatility for the winner in the database');
  client.query(`UPDATE players SET wins = ${newWins}, winRate = ${newWinRate}, rating = ${winningPlayer.rating}, attendance = ${attendance} ratingDev = ${winningPlayer.ratingDeviation}, volatility = ${winningPlayer.volatility}, ratingHistory = ${newRatingHistory}, winRateHistory = ${newWinRateHistory} WHERE id = ${playerId};`);
};

const updateLoserInfoInDatabase = (playerId, newLosses, newWinRate, losingPlayer, attendance, newRatingHistory, newWinRateHistory) => {
  console.log('Updating losses, winRate, rating, attendance, ratingDev, and volatility for the loser in the database');
  client.query(`UPDATE players SET losses = ${newLosses}, winRate = ${newWinRate}, rating = ${losingPlayer.rating}, attendance = ${attendance}, ratingDev = ${losingPlayer.ratingDeviation}, volatility = ${losingPlayer.volatility}, ratingHistory = ${newRatingHistory}, winRateHistory = ${newWinRateHistory} WHERE id = ${playerId};`);
};

module.exports = recalculatePlayerStatistics;