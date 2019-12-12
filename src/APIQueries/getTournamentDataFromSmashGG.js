'use strict';

const smashGG = require('smashgg.js');

const processSmashGGTournament = require('../coreFunctions/processSmashGGTournament');

smashGG.initialize(process.env.SMASHGG_API_KEY);

const { Tournament, Event } = smashGG;

const getTournamentDataFromSmashGG = (tournament, event) => {
  console.log('Querying Smash.gg for tournament data');

  const tournamentData = {};
  
  const tournamentPromise = new Promise((resolve, reject) => {
    Tournament.get(tournament)
      .then((tournamentObject) => {
        tournamentData.tournament = tournamentObject;   
        resolve();   
      })
      .catch((error) => {
        reject(error);
      });
  });

  Event.get(tournament, event)
    .then((eventObject) => {
      tournamentData.eventSlug = eventObject.slug;

      const setsPromise = new Promise((resolve, reject) => {
        eventObject.getSets({
          filterDQs: true,
          filterByes: true,
        })
          .then((sets) => {
            tournamentData.sets = sets;
            tournamentData.numberOfSets = sets.length;
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      });

      const standingsPromise = new Promise((resolve, reject) => {
        eventObject.getStandings()
          .then((standings) => {
            tournamentData.standings = standings;
            tournamentData.numberOfEntrants = standings.length;
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      });

      const promiseArray = [tournamentPromise, setsPromise, standingsPromise];
    
      Promise.all(promiseArray)
        .then(() => {
          processSmashGGTournament(tournamentData);
        })
        .catch((error) => {
          throw error;
        });
    })
    .catch((error) => {
      throw error;
    });
};

module.exports = getTournamentDataFromSmashGG;
