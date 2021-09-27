const rsmqWorker = require("rsmq-worker");
const { QUEUE } = require("../constants");
const MessageController = require("../controllers/MessagesController");
const queueInstance = require("../services/MessageQueue").queueInstance;
const SmsGateway = require("../services/SmsGateway");
const worker = new rsmqWorker(QUEUE, queueInstance);

worker.on("message", async function (msg, next, msgid) {
	try {

		let message = JSON.parse(msg);
        let {to, body, sender, extMessageId, gateway, id} = message

        // save message
		let new_message = await MessageController.storeMessage(to, body, sender.id, gateway.id, extMessageId, id)

        // send sms
		let result = await SmsGateway.send(to, body, sender.name, gateway.slug)

        // update message
        if (result) await MessageController.storeGatewayMessageId(result.id, id)


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
