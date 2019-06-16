// 'use strict';

// const client = require('./client');

// client.connect();

// const wipeOldRankingData = () => {
//   const currentDate = new Date();
//   const dataExpirationDate = currentDate - (1000 * 60 * 60 * 24 * 90);

//   checkTournamentDates(dataExpirationDate);
// };

// const checkTournamentDates = (expirationDate) => {
//   return client.query('SELECT * FROM tournaments;')
//     .then((data) => {
//       data.rows.forEach((tournament) => {
//         if (tournament.date < expirationDate) {
//           cleanScoresGainedFromTournament(tournament);
//         }
//       });
//     })
//     .catch((error) => {
//       throw error;
//     });
// };

// const cleanScoresGainedFromTournament = (tournament) => {
//   return client.query(`SELECT * FROM matches WHERE tournamentId = ${tournament.id}`)
//     .then((data) => {
//       data.rows.forEach((match) => {
//         const playerToUpdate = match.winnerId;
//       });
//     })
//     .catch((error) => {
//       throw error;
//     });
// };

// module.exports = wipeOldRankingData;