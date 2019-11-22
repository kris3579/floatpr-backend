'use strict';

const webhook = require('webhook-discord');

const Hook = new webhook.Webhook(`${process.env.DISCORD_WEBHOOK_URL}`);

const sendNotificationToDiscord = (request, resolve) => {
  let requestText = '';
  switch (request.requestType) {
    case 'addTournament':
      requestText = `Request to add the tournament located at ${request.tournamentURL} to the database.`;
      break;
    case 'editTag':
      requestText = `Request from user ${request.user} to edit their tag. New Tag: ${request.newTag}`;
      break;
    case 'editMains':
      requestText = `Request from user ${request.user} to edit their mains. Main: ${request.firstMain}, Second: ${request.secondMain || 'None'}, Third: ${request.thirdMain || 'None'}`;
      break;
    case 'editState':
      requestText = `Request from user ${request.user} to edit thier state/region. newState: ${request.state}`;
      break;
    case 'editSponser':
      requestText = `Request from user ${request.user} to edit their sponser. Sponser: ${request.sponser}`;
      break;
    case 'combineResults':
      requestText = `Request from user ${request.userTag} to merge the results from secondTag: ${request.secondTag}.`;
      break;
    default:
      break;
  }

  const msg = new webhook.MessageBuilder()
    .setName('Float_Pr_Notifier')
    .setText(`${requestText}`)
    .setTime();

  Hook.send(msg);
  resolve();
};

module.exports = sendNotificationToDiscord;
