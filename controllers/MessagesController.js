const Message = require("../models/Message");
const Sender = require("../models/Sender");
const MessageQueue = require("../services/MessageQueue");

const { Op } = require("sequelize");
const { SUCCESS_CODE, SERVER_ERROR, FAILURE_CODE } = require("../constants");

/**
 * Returns all messages for a client/sender
 * @param {*} request
 * @param {*} response
 * @returns
 */
exports.all = async (request, response) => {
	try {
		let client = request.body.client;
		let sender_ids = client.senders.map((sender) => sender.id);

		let messages = await Message.findAll({
			attributes: [
				["id", "smsId"],
				"recipient",
				"message",
				["ext_message_id", "extMessageId"],
				"status",
				["created_at", "date"],
			],
			include: {
				model: Sender,
				attributes: ["name"],
			},
			where: {
				sender_id: { [Op.in]: sender_ids },
			},
		});

		if (messages) {
			return response.send({
				errorCode: SUCCESS_CODE,
				messages: messages,
			});
		}

		return response.send({
			errorCode: FAILURE_CODE,
			errorMessage: "error fetching messages",
			messages: [],
		});
	} catch (error) {
		console.log("error fetching messages: ", error);
		return response.status(SERVER_ERROR).send({
			errorCode: FAILURE_CODE,
			errorMessage: "error fetching messages",
			messages: [],
		});
	}
};

/**
 * Stores and sends a message
 * @param {*} request
 * @param {*} response
 * @returns
 */
exports.send = async (request, response) => {
	try {
		let { sender, messages } = request.body;
		let stored_messages = [];

		if (messages && sender) {
			for (message of messages) {
				// save message
				let new_message = await storeMessage(
					message.to,
					message.body,
					sender.id,
					message.extMessageId
				);

				if (new_message) {
					stored_messages.push(new_message);
					console.log(new_message);
					// add message to queue
					await MessageQueue.add({
						body: message.body,
						to: message.to,
						sender: sender.name,
						id: new_message.smsId,
					});
				} else {
					return response.status(SERVER_ERROR).send({
						errorCode: FAILURE_CODE,
						errorMessage: "error sending messages",
						messages: [],
					});
				}
			}

			return response.send({
				errorCode: SUCCESS_CODE,
				messages: stored_messages,
			});
		}

		return response.status(SERVER_ERROR).send({
			errorCode: FAILURE_CODE,
			errorMessage: "senderName and messages are required",
			messages: [],
		});
	} catch (error) {
		console.log("error sending messages: ", error);
		return response.status(SERVER_ERROR).send({
			errorCode: FAILURE_CODE,
			errorMessage: "error sending messages",
			messages: [],
		});
	}
};

/**
 * Stores a message in the database
 * @param {String} recipient - recipient
 * @param {String} message - message's body
 * @param {UUID} sender_id - message's sender name
 * @param {String} extMessageId - external message id from client
 * @returns {Promise}
 */
const storeMessage = async (
	recipient,
	message,
	sender_id,
	extMessageId = null
) => {
	try {
		let new_msg = await Message.create({
			recipient,
			message,
			sender_id,
			ext_message_id: extMessageId,
		});

		new_msg = JSON.parse(JSON.stringify(new_msg));

		new_msg = await Message.findByPk(new_msg.id, {
			attributes: [
				["id", "smsId"],
				"recipient",
				"message",
				["ext_message_id", "extMessageId"],
				"status",
				["created_at", "date"],
			],
			include: {
				model: Sender,
				attributes: ["name"],
			},
		});

		new_msg = JSON.parse(JSON.stringify(new_msg));

		return new_msg;
	} catch (error) {
		console.log("error creating message: ", error);

		return null;
	}
};

/**
 * Updates message with twilio status and sid
 * @param {String} status - message status from twilio
 * @param {String} twilio_message_sid - message sid from twilio
 * @param {UUID} id - api message id
 * @returns {Object} - updated message
 */
exports.setTwilioSid = async (status, twilio_message_sid, id) => {
	try {
		let [meta, updated_msg] = await Message.update(
			{
				twilio_message_sid: twilio_message_sid,
				status: status,
			},
			{ where: { id: id }, returning: true }
		);

		updated_msg = JSON.parse(JSON.stringify(updated_msg));

		console.log({ updated_msg });

		return updated_msg;
	} catch (error) {
		console.log("error updating message: ", error);

		return null;
	}
};

/**
 * Twilio's method to update messages status
 * @param {*} request
 * @param {*} response
 * @returns {*} response
 */
exports.updateStatus = async (request, response) => {
	try {
		let message_sid = request.body.MessageSid;
		let message_status = request.body.MessageStatus;

		let [meta, updated_msg] = await Message.update(
			{
				status: message_status,
			},
			{ where: { twilio_message_sid: message_sid }, returning: true }
		);

		updated_msg = JSON.parse(JSON.stringify(updated_msg));

		console.log({ updated_msg });

		return response.send({ ok: 200 });
	} catch (error) {
		console.log("error updating message status: ", error);
		return response.status(SERVER_ERROR).send({ failure: SERVER_ERROR });
	}
};
