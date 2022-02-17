const rsmqWorker = require("rsmq-worker")
const constants = require("../constants")
const UsersController = require("../controllers/UsersController")
const Queue = require("../Queue")
const Twilio = require("../services/Twilio")
const logger = require("../logger")
const MessagePart = require("../models/MessagePart")

const worker = new rsmqWorker(constants.TWILIO_MESSAGES_QUEUE, Queue.queueInstance);

worker.on("message", async function (msg, next, msgid) {

	try {


		const message = JSON.parse(msg);
		const {to, body, sender, message_id, user} = message

		// send sms
		const twilio = new Twilio(to, body, sender)
		const result = await twilio.send()

		if (result)
		{
			await MessagePart.create({
				part: body,
				message_id,
				gateway_message_id: result.id
			})

			await UsersController.updateCredits(user.id)

			await Queue.removeFromQueue(constants.TWILIO_MESSAGES_QUEUE, msgid);
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
