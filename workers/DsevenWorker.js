const rsmqWorker = require("rsmq-worker");
const constants = require("../constants");
const UsersController = require("../controllers/UsersController");
const Queue = require("../Queue");
const Dseven = require("../services/DSeven");
const logger = require("../logger");
const MessagePart = require("../models/MessagePart");
const DSeven = require("../services/DSeven");
const Message = require("../models/Message");

const worker = new rsmqWorker(
	constants.DSEVEN_MESSAGES_QUEUE,
	Queue.queueInstance
);

worker.on("message", async function (msg, next, msgid) {
	try {
		const message = JSON.parse(msg);
		const { to, body, parts, credits, sender, message_id, user_id } = message;

		// send sms
		const dseven = new DSeven();
		const result = await dseven.send(to, body, sender);

		if (!result) throw Error("Unable to send message from DsevenWorker");


        for (const text of parts)
        {
            MessagePart.create({
                part: text,
                message_id
            });
        }

        UsersController.updateCredits(user_id, credits),

        Message.update({
            gateway_message_id: result.id
        }, {where: {id: message_id}}),

        Queue.removeFromQueue(constants.DSEVEN_MESSAGES_QUEUE, msgid)

	} catch (error) {

		logger.error("error sending message from queue: ", error);
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
