const rsmqWorker = require("rsmq-worker");
const constants = require("../constants");
const MessagesFactory = require("../factories/MessagesFactory")
const Message = require("../models/Message")
const UsersController = require("../controllers/UsersController")
const Queue = require("../Queue")
const Bulkgate = require("../services/Bulkgate")
const logger = require("../logger")
const ContactFactory = require("../factories/ContactsFactory");

const worker = new rsmqWorker(constants.BULKGATE_MESSAGES_QUEUE, Queue.queueInstance);

worker.on("message", async function (msg, next, msgid) {

	try {

		const message = JSON.parse(msg);
		const {to, body, sender, extMessageId, gateway, id, user} = message

		// send sms
		const bulkgate = new Bulkgate(to, body, sender.name)
		const result = await bulkgate.send()

		// update message
		if (result) {

			const contact = await ContactFactory.createContact(null, null, null, null, [to], null, user)
			const message_stored = await Message.findByPk(id)

			// If the message doesn't exist then it is being sent for the first time
			if (!message_stored) {

				const msisdn = contact?.msisdns.find(msisdn => msisdn.id === to)

				if (msisdn) {

					// save message
					const message = await MessagesFactory.storeMessage(msisdn.id, body, sender.id, gateway.id, extMessageId, user.id, result.id, id)

					if (message) await UsersController.updateCredits(user.id)
				}
				else
				{
					logger.error("message not stored. msisdn not returned", {contact})
				}
			}

			await Queue.removeFromQueue(constants.BULKGATE_MESSAGES_QUEUE, msgid);
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
