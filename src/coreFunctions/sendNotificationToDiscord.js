'use strict';

const webhook = require('webhook-discord');

const Hook = new webhook.Webhook(`${process.env.DISCORD_WEBHOOK_URL}`);

const sendNotificationToDiscord = (request) => {
  let requestText = '';
  switch(request.requestType) {
  case 'editMains':
    requestText = `Request from user ${request.user} to edit their mains. newMain: ${request.newMain}, doWeDelete: ${request.doWeDelete}`;
    break;
  case 'combineResults':
    requestText = `Request from user ${request.userTag} to combine the results from secondTag: ${request.secondTag}`;
    break;
  case 'editState':
    requestText = `Request from user ${request.user} to edit thier state/region, newState: ${request.state}`;
    break;
  }

  const msg = new webhook.MessageBuilder()
    .setName('Float_Pr_Notifier')
    .setText(`${requestText}`)
    .setTime();

  Hook.send(msg);
};

module.exports = sendNotificationToDiscord;