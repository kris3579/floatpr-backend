'use strict';

const fs = require('fs');
const stringSimilarity = require('string-similarity');

const client = require('../client');

const writeTagsToFile = (tags) => {
  fs.writeFileSync(`${__dirname}/../similarTags.txt`, tags);
};

const createTagsDataString = (tagsData) => {
  let tagsString = '';

  const sortedTags = [];
  
  Object.keys(tagsData).forEach((tag) => {
    sortedTags.push(tag);
  });

  sortedTags.sort();

  sortedTags.forEach((tag) => {
    const tagObject = tagsData[tag];
    if (tagObject.similarTags.length > 0) {
      const similarNames = tagObject.similarTags.join(', ');
      
      tagsString += `${tagObject.tag}, Attendance: ${tagObject.attendance}, Sponser: ${tagObject.sponser}, Similar Names: ${similarNames}\n`;
    }
  });

  writeTagsToFile(tagsString);
};

const findSimilarTags = () => {
  client.query('SELECT name, sponser, attendance FROM players;')
    .then((data) => {
      const similarTagsData = {};

      data.rows.forEach((player1) => {
        similarTagsData[player1.name] = {
          tag: player1.name,
          sponser: player1.sponser,
          attendance: player1.attendance,
          similarTags: [],
        };

        data.rows.forEach((player2) => {
          if (player2 !== player1) {
            const similarity = stringSimilarity.compareTwoStrings(player1.name, player2.name);

            if (similarity > 0.5) {
              similarTagsData[player1.name].similarTags.push(player2.name);
            }
          }
        });
      });

      createTagsDataString(similarTagsData);
    });
};

module.exports = findSimilarTags;
