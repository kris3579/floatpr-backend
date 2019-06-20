'use strict';

const webhook = require('webhook-discord');

const Hook = new webhook.Webhook('https://discordapp.com/api/webhooks/590582333787209735/7Z8Zkpwn08Of9BgGte-4krcAwBDXOzHr7wweIsI_8fNYxeSjzYOdEK875FCY2kK_2Hob');

const sendNotificationToDiscord = (request) => {

  const notification = request;

  Hook.info('FloatPR Hook', notification);
};

module.exports = sendNotificationToDiscord;