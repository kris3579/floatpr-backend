'use strict';

const webhook = require('webhook-discord');

const Hook = new webhook.Webhook(`${process.env.DISCORD_WEBHOOK_URL}`);

const sendNotificationToDiscord = (request) => {
  let requestText = '';
  if (request.requestType === 'editMains') {
    requestText = `Request from user ${request.user} to edit mains. newMain: ${request.newMain}, doWeDelete: ${request.doWeDelete}`;
  }
  if (request.requestType === 'combineResults') {
    requestText = `Request from user ${request.user} to combine results. firstTag: ${request.firstTag}, secondTag: ${request.secondTag}`;
  }

  const msg = new webhook.MessageBuilder()
    .setName('Float_Pr_Notifier')
    .setText(`${requestText}`)
    .setTime();

  Hook.send(msg);
};

module.exports = sendNotificationToDiscord;