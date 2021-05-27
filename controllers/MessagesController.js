const Message = require("../models/Message");
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
			where: {
				sender_id: { [Op.in]: sender_ids },
			},
		});

		if (messages) {
			return response.send({
				error_code: SUCCESS_CODE,
				messages: messages,
			});
		}

		return response.send({
			error_code: FAILURE_CODE,
			error_message: "error fetching messages",
			messages: [],
		});
	} catch (error) {
		console.log("error fetching messages: ", error);
		return response.status(SERVER_ERROR).send({
			error_code: FAILURE_CODE,
			error_message: "error fetching messages",
			messages: [],
		});
	}
};

exports.get = async (request, response) => {
	try {
	} catch (error) {}
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
					sender.id
				);

				if (new_message) stored_messages.push(new_message);

				// add message to queue
				await MessageQueue.add({
					body: message.body,
					to: message.to,
					sender: sender.name,
				});
			}

			return response.send({
				error_code: SUCCESS_CODE,
				messages: stored_messages,
			});
		}

		return response.status(SERVER_ERROR).send({
			error_code: FAILURE_CODE,
			error_message: "sender_name and messages are required",
			messages: [],
		});
	} catch (error) {
		console.log("error sending messages: ", error);
		return response.status(SERVER_ERROR).send({
			error_code: FAILURE_CODE,
			error_message: "error sending messages",
			messages: [],
		});
	}
};

/**
 * Stores a message in the database
 * @param {String} recipient - recipient
 * @param {String} message - message's body
 * @param {UUID} sender_id - message's sender name
 * @param {String} ext_message_id - external message id from client
 * @returns {Promise}
 */
const storeMessage = async (
	recipient,
	message,
	sender_id,
	ext_message_id = null
) => {
	try {
		return await Message.create({
			recipient,
			message,
			sender_id,
			ext_message_id,
		});
	} catch (error) {
		console.log("error creating message: ", error);

		return null;
	}
};
