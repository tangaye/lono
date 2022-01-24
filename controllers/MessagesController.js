const Message = require("../models/Message");
const Sender = require("../models/Sender");
const Queue = require("../services/Queue")
const { Op } = require("sequelize");
const constants = require("../constants")
const MessagesValidator = require("../validators/messages")
const { v4: uuidv4 } = require("uuid")
const Gateway = require("../models/Gateway")
const logger = require("../logger");
const MessageFactory = require("../factories/messages")



/**
 * Returns all messages for a user/sender
 * @param {*} request
 * @param {*} response
 * @returns
 */
exports.all = async (request, response) => {
	try {


		const { page, size, search, order } = request.query;
		const { limit, offset} = MessageFactory.getPagination(page, size);
		const { order_by } = MessageFactory.getOrder(order);
		const condition = MessageFactory.getCondition(search);

		let user = request.user
        // get user senders
		let sender_ids = user.senders.map((sender) => sender.id);

        // query messages sent by user senders
		let messages = await Message.findAndCountAll({
			attributes: constants.MESSAGES_ATTRIBUTES,
			include: {
				model: Sender,
				attributes: ["name"],
			},
			where: condition,
			order: [['created_at', order_by]],
			limit,
			offset
		});

		if (messages) {

			console.log({messages})

			return response.send({
				errorCode: constants.SUCCESS_CODE,
				...MessageFactory.getPagingData(messages, page, limit)
			});
		}

		return response.send({
			errorCode: constants.FAILURE_CODE,
			errorMessage: "error fetching messages",
			messages: [],
		})

	} catch (error) {
		logger.error("error fetching messages: ", error);
		return response.status(constants.SERVER_ERROR).send({
			errorCode: constants.FAILURE_CODE,
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
                    status: constants.PENDING_STATUS
                }

                await Queue.add({
                    body: payload.message,
                    to: payload.recipient,
                    sender: payload.sender,
                    extMessageId: payload.extMessageId,
                    gateway: result.gateway,
                    id: payload.smsId,
                    user
                }, constants.MESSAGES_QUEUE )

                stored_messages.push(payload)
			}

			return response.send({
				errorCode: constants.SUCCESS_CODE,
				messages: stored_messages,
			});
		}

		return response.send({
			errorCode: constants.FAILURE_CODE,
			errorMessage: result.message,
			messages: [],
		})

	} catch (error) {
		logger.error("error sending messages: ", error);
		return response.status(constants.SERVER_ERROR).send({
			errorCode: constants.FAILURE_CODE,
			errorMessage: error?.errors[0]?.message || "error sending messages",
			messages: [],
		});
	}
};

exports.getStats = async (request, response) => {

	try {

		const user = request.user
		const sender_ids = user.senders.map((sender) => sender.id);

		const last_seven_counts = await MessageFactory.lastSevenDaysCount(sender_ids)
		const total_today = await MessageFactory.totalToday(sender_ids)
		const total = await MessageFactory.total(sender_ids)
		const latest_five = await MessageFactory.latestFive(sender_ids)

		if (last_seven_counts && total_today && total) return response.send({
			errorCode: constants.SUCCESS_CODE,
			statistics: {
				total,
				lastSeven: last_seven_counts,
				latestFive: latest_five,
				totalToday: total_today[0].count
			},
		})

		return response.send({
			errorCode: constants.FAILURE_CODE,
			errorMessage: "error fetching data",
			statistics: null
		})
	}
	catch (error)
	{
		logger.error("error fetching data: ", error);
		return response.status(constants.SERVER_ERROR).send({
			errorCode: constants.FAILURE_CODE,
			errorMessage: error?.errors[0]?.message || "error fetching data",
			data: null,
		})
	}

}

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
            cost: constants.SMS_TARIFF
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
 * Updates message gateway's id
 * @param {String} gateway_message_id - message id from bulkgate sms gateway
 * @param {UUID} message_id - api message id
 * @returns {Object} - updated message
 */
exports.setBulkgateId = async (gateway_message_id, message_id) => {
	try {

		let [meta, updated_msg] = await Message.update(
			{
                gateway_message_id: gateway_message_id
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



exports.bulkGateUpdateStatus = async (request, response) => {
    try {
        let {status, price, smsID} = request.query

        let bulkgate_statuses = [
            {code: 1, name: "delivered"},
            {code: 2, name: "pending"},
            {code: 3, name: "failed"}
        ]

        if (smsID) {


            let message = await Message.findOne({where: {
                gateway_message_id: smsID
            }})

            let message_status = bulkgate_statuses.find(item => item.code === Number(status))

            console.log({status, price, smsID, message_status})

            if (message) await message.update({status: message_status.name})
        }

        return response.send({ ok: 200 })
    } catch (error) {
        logger.error("error updating bulkgate message status: ", error);
		return response.status(constants.SERVER_ERROR).send({ failure: constants.SERVER_ERROR });
    }
}

/**
 * Twilio's method to update messages status
 * @param {*} request
 * @param {*} response
 * @returns {*} response
 */
 exports.twilioUpdateStatus = async (request, response) => {
	try {

        let message_sid = request.body.MessageSid
        let message_status = request.body.MessageStatus
        let status = constants.PENDING_STATUS;

        if (message_status.includes('accepted', 'queued', 'sending', 'receiving', 'scheduled')) status = constants.PENDING_STATUS
        if (message_status.includes('delivered', 'received')) status = constants.DELIVERED_STATUS
        if (message_status.includes('failed', 'canceled')) status = constants.FAILED_STATUS

        if (message_sid && message_status) {
            let [meta, updated_msg] = await Message.update({status},
                { where: { alt_gateway_message_id: message_sid }, returning: true }
            )

            updated_msg = JSON.parse(JSON.stringify(updated_msg))

            console.log('Twilio update', {updated_msg})
        }

		return response.send({ ok: 200 })

	} catch (error) {
		logger.error("error updating twilio message status: ", error);
		return response.status(constants.SERVER_ERROR).send({ failure: constants.SERVER_ERROR });
	}
}

/**
 * Updates message with twilio's sid
 * @param {String} status - message status from twilio
 * @param {String} twilio_message_sid - message sid from twilio
 * @param {UUID} id - api message id
 * @returns {Object} - updated message
 */
 exports.setTwilioIds = async (status, twilio_message_sid, id) => {
	try {
        console.log({status, twilio_message_sid, id})
        let gateway = await Gateway.findOne({where: {slug: constants.TWILIO_GATEWAY}})

		let [meta, updated_msg] = await Message.update(
			{
				alt_gateway_message_id: twilio_message_sid,
                alt_gateway_id: gateway?.id
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

