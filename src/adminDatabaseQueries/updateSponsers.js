'use strict';

const client = require('../client');

const updateSponsers = (resolve) => {
  console.log('Updateing sponsers in sets to reflect sponser in players');

  client.query('SELECT name, sponser FROM players;')
    .then((playersData) => {
      playersData.rows.forEach((player) => {
        client.query('UPDATE sets SET winner_sponser = $1 WHERE winner_name = $2;', [player.sponser, player.name]);
        client.query('UPDATE sets SET loser_sponser = $1 WHERE loser_name = $2;', [player.sponser, player.name]);
        
        client.query('SELECT placements FROM tournaments;')
          .then((tournamentsData) => {
            tournamentsData.rows.forEach((tournament) => {
              const updatedPlacements = JSON.parse(tournament.placements);

              Object.keys(updatedPlacements).forEach((placement) => {
                placement.forEach((person, i) => {
                  const personMatch = new RegExp(person);
                  if (person.match(personMatch)) {
                    updatedPlacements[placement][i] = player.sponser;
                  }
                });
              });

              JSON.stringify(updatedPlacements);
            
              if (updatedPlacements !== tournament.placements) {
                client.query('UPDATE tournaments SET placements = $1;', [updatedPlacements]);
              }
            });
          });
      });
      resolve();
    });
};

module.exports = updateSponsers;
