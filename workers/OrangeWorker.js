const rsmqWorker = require("rsmq-worker");
const constants = require("../constants");
const UsersController = require("../controllers/UsersController");
const Queue = require("../Queue");
const Orange = require("../services/Orange");
const logger = require("../logger");
const MessagePart = require("../models/MessagePart");

const worker = new rsmqWorker(
	constants.ORANGE_MESSAGES_QUEUE,
	Queue.queueInstance
);

worker.on("message", async function (msg, next, msgid) {
	try {
		const message = JSON.parse(msg);
		const { to, body, sender, message_id, user_id } = message;
		console.log("message to queue: ", { message });

		// send sms
		const orange = new Orange();
		const result = await orange.send(to, body, sender);

		if (result) {
			await MessagePart.create({
				part: body,
				message_id,
				gateway_message_id: result.id,
			});

			const updated = await UsersController.updateCredits(user_id, 1);

			console.log("Updated message from queue: ", updated[0]);

			await Queue.removeFromQueue(constants.ORANGE_MESSAGES_QUEUE, msgid);
		}
	} catch (error) {
		logger.log("error sending message from queue: ", error);
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
