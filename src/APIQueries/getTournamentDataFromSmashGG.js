'use strict';

const smashGG = require('smashgg.js');
const Tournament = smashGG.Tournament;

const processSmashGGTournament = require('../coreFunctions/processSmashGGTournament');

smashGG.initialize(process.env.SMASHGG_API_KEY);

const getTournamentDataFromSmashGG = async (tournament) => {
  console.log('Querying Smash.gg for tournament data');
  // const tournamentObject = await Tournament.getTournament(tournament);
  const events = await Tournament.getEvents();
  console.log(events);
  // const singles = filter event array ?
  // const entrants = await singles.getEntrants();
  // const sets = await singles.getSets({options: {
  //   filterDQs: true,
  //   filterByes: true,
  // }});
  // const standings = await singles.getStandings();

  // const tournamentData = {
  //   tournament: tournamentObject,
  //   entrants: entrants,
  //   sets: sets,
  //   standings: standings,
  // };

  // console.log(tournamentData);
  // processSmashGGTournament(tournamentData);
};

module.exports = getTournamentDataFromSmashGG;