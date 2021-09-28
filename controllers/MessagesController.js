const Message = require("../models/Message");
const Sender = require("../models/Sender");
const MessageQueue = require("../services/MessageQueue")
const { Op } = require("sequelize");
const { SUCCESS_CODE, SERVER_ERROR, FAILURE_CODE, BULKGATE_GATEWAY, TWILIO_GATEWAY, SMS_TARIFF } = require("../constants")
const MessagesValidator = require("../validators/messages")
const { v4: uuidv4 } = require("uuid")
const Gateway = require("../models/Gateway")
const logger = require("../logger")

/**
 * Returns all messages for a user/sender
 * @param {*} request
 * @param {*} response
 * @returns
 */
exports.all = async (request, response) => {
	try {

		let user = request.user
        // get user senders
		let sender_ids = user.senders.map((sender) => sender.id);

        // query messages sent by user senders
		let messages = await Message.findAll({
			attributes: [
				["id", "smsId"],
				"recipient",
				"message",
				["ext_message_id", "extMessageId"],
				"status",
                "cost",
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
		})

	} catch (error) {
		logger.error("error fetching messages: ", error);
		return response.status(SERVER_ERROR).send({
			errorCode: FAILURE_CODE,
			errorMessage: error?.errors[0]?.message || "error fetching messages",
			messages: [],
		})
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
        let user = request.user
		let stored_messages = []

        // validate messages
		let result = await MessagesValidator.validate(messages, user)

		if (result.valid) {

			for (message of messages) {

                let payload = {
                    smsId: uuidv4(),
                    recipient: message.to,
                    message: message.body,
                    sender,
                    extMessageId: message.extMessageId,
                    status: "pending"
                }

                await MessageQueue.add({
                    body: payload.message,
                    to: payload.recipient,
                    sender: payload.sender,
                    extMessageId: payload.extMessageId,
                    gateway: result.gateway,
                    id: payload.smsId,
                    user
                })

                stored_messages.push(payload)
			}

			return response.send({
				errorCode: SUCCESS_CODE,
				messages: stored_messages,
			});
		}

		return response.send({
			errorCode: FAILURE_CODE,
			errorMessage: result.message,
			messages: [],
		})

	} catch (error) {
		logger.error("error sending messages: ", error);
		return response.status(SERVER_ERROR).send({
			errorCode: FAILURE_CODE,
			errorMessage: error?.errors[0]?.message || "error sending messages",
			messages: [],
		});
	}
};

/**
 * Stores a message in the database
 * @param {String} recipient - recipient
 * @param {String} message - message's body
 * @param {UUID} sender_id - message's sender id
 * @param {UUID} gateway_id - sms gateway id
 * @param {String} extMessageId - external message id from user
 * @param {UUID} id - message id
 * @returns {Promise}
 */
exports.storeMessage = async (
	recipient,
	message,
	sender_id,
    gateway_id,
	extMessageId = null,
    id
) => {
	try {

		let new_msg = await Message.create({
            id,
			recipient,
			message,
			sender_id,
            gateway_id,
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

		logger.log("error creating message: ", error);

		return null;
	}
};

/**
 * Updates message gateway's id and message cost
 * @param {String} gateway_message_id - message id from sms gateway
 * @param {UUID} message_id - api message id
 * @returns {Object} - updated message
 */
exports.updateMessageIdCost = async (gateway_message_id, message_id) => {
	try {

		let [meta, updated_msg] = await Message.update(
			{
                gateway_message_id: gateway_message_id,
                cost: SMS_TARIFF
            },
			{ where: { id: message_id }, returning: true }
		)

		updated_msg = JSON.parse(JSON.stringify(updated_msg));

		return updated_msg;
	} catch (error) {
		logger.error("error updating message: ", error);

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

        console.log('sms gateway callback request: ', request)

        let gateway = await Gateway.findOne({where: {active: true}})

        if (gateway) {

            if (gateway.slug === TWILIO_GATEWAY) {

                let message_sid = request.body.MessageSid
                let message_status = request.body.MessageStatus

                let [meta, updated_msg] = await Message.update(
                    {
                        status: message_status,
                    },
                    { where: { ext_message_id: message_sid }, returning: true }
                )

                updated_msg = JSON.parse(JSON.stringify(updated_msg))

            } else if (gateway === BULKGATE_GATEWAY) {
               logger.log('bulkgate: ', request.body)
            }

        }


		return response.send({ ok: 200 })

	} catch (error) {
		logger.error("error updating message status: ", error);
		return response.status(SERVER_ERROR).send({ failure: SERVER_ERROR });
	}
}
