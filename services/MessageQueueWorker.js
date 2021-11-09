const rsmqWorker = require("rsmq-worker");
const constants = require("../constants");
const MessageController = require("../controllers/MessagesController")
const Message = require("../models/Message")
const UsersController = require("../controllers/UsersController")
const queueInstance = require("./Queue").queueInstance;
const SmsGateway = require("../services/SmsGateway");
const worker = new rsmqWorker(constants.MESSAGES_QUEUE, queueInstance);

worker.on("message", async function (msg, next, msgid) {
	try {

		let message = JSON.parse(msg);
        let {to, body, sender, extMessageId, gateway, id, user} = message
        let gateway_slug = constants.TWILIO_GATEWAY
        let message_stored = await Message.findByPk(id)

        // If the message doesn't exists then it is being sent for the first time
        if (!message_stored) {

            // save message
		    await MessageController.storeMessage(to, body, sender.id, gateway.id, extMessageId, id)

            // update user credits
            await UsersController.updateCredits(user.id)

            gateway_slug = gateway.slug

        }

        // send sms
		let result = await SmsGateway.send(to, body, sender.name, gateway_slug)

        // update message
        if (result) {

            if (gateway_slug === constants.TWILIO_GATEWAY) {

                await MessageController.setTwilioIds(result.status, result.id, id);
            }

            if (gateway_slug === constants.BULKGATE_GATEWAY) {

                await MessageController.setBulkgateId(result.id, id);
            }
        }


	} catch (error) {
		console.log("error sending message from queue: ", error);
	}
	next();
});

// optional error listeners
worker.on("error", function (err, msg) {
	console.log("ERROR", err, msg.id);
});
worker.on("exceeded", function (msg) {
	console.log("EXCEEDED", msg.id);
});
worker.on("timeout", function (msg) {
	console.log("TIMEOUT", msg.id, msg.rc);
});

module.exports = worker;
