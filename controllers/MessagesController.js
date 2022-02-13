const Message = require("../models/Message")
const Sender = require("../models/Sender")
const User = require("../models/User")
const Gateway = require("../models/Gateway")
const Queue = require("../Queue")
const { v4: uuidv4 } = require("uuid")
const constants = require("../constants")
const MessageFactory = require("../factories/MessagesFactory")
const logger = require("../logger")
const helper = require("../helpers")
const ContactFactory = require("../factories/ContactsFactory");
const Contact = require("../models/Contact");
const database = require("../database/connection");
const {QueryTypes} = require("sequelize");


/**
 * Returns all messages for a user/sender
 * @param {*} request
 * @param {*} response
 * @returns
 */
exports.all = async (request, response) => {
	try {

		const user = request.body.user
		const senders = user.senders.map((sender) => sender.id)

		const { page, size, search, order, id } = request.query
		const { limit, offset} = helper.getPagination(page, size)

		const replacements = MessageFactory.buildReplacements(senders, id, search, limit, offset)
		const query_string = MessageFactory.buildQuery(search, id, order)

		const count = await Message.count({distinct: true})
		const results = await database.query(query_string, {
			replacements,
			type: QueryTypes.SELECT
		})

		if (results) return helper.respond(response, {
			code: constants.SUCCESS_CODE,
			...MessageFactory.getPagingData(results, count, page, limit)
		})

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: "error fetching messages"
		})


	} catch (error) {

		const message = "error fetching messages"

		logger.log(message, error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: error?.errors ? error?.errors[0]?.message : message
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

		const { sender, messages, user, gateway } = request.body;
		const queued_messages = []

		for (message of messages) {

			const payload = {
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
				gateway,
				id: payload.smsId,
				user
			}, helper.getGatewayQueue(gateway.slug))

			queued_messages.push(payload)
		}

		return response.send({
			errorCode: constants.SUCCESS_CODE,
			messages: queued_messages,
		});



	} catch (error) {

		logger.error("error sending messages: ", error);

		return response.status(constants.SERVER_ERROR).send({
			errorCode: constants.FAILURE_CODE,
			errorMessage: error?.errors ? error.errors[0].message : "error sending messages"
		})
	}

};

exports.statistics = async (request, response) => {

	try {

		const user = request.body.user
		const sender_ids = user.senders.map((sender) => sender.id)

		if (sender_ids.length <= 0) return helper.respond(response, {
			code: constants.SUCCESS_CODE,
			statistics: {
				total: 0,
				lastSeven: 0,
				latestFive: 0,
				totalToday: 0
			},
		})

		const last_seven_counts = await MessageFactory.lastSevenDaysCount(sender_ids)
		const total_today = await MessageFactory.totalToday(sender_ids)
		const total = await MessageFactory.total(sender_ids)
		const latest_five = await MessageFactory.latestFive(sender_ids)

		if (last_seven_counts && total_today && total !== null) return helper.respond(response, {
				code: constants.SUCCESS_CODE,
				statistics: {
					total,
					lastSeven: last_seven_counts,
					latestFive: latest_five,
					totalToday: total_today[0].count
				},
			})

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: "error fetching data"
		})
	}
	catch (error)
	{
		const message = "error fetching data"

		logger.log(message, error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: error?.errors ? error?.errors[0]?.message : message
		})

	}

}



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

        const message_sid = request.body.MessageSid
        const message_status = request.body.MessageStatus
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


        const gateway = await Gateway.findOne({where: {slug: constants.TWILIO_GATEWAY}})

		let [meta, updated_msg] = await Message.update(
			{
				alt_gateway_message_id: twilio_message_sid,
                alt_gateway_id: gateway?.id
			},
			{ where: { id: id }, returning: true }
		);

		updated_msg = JSON.parse(JSON.stringify(updated_msg));

		return updated_msg;

	} catch (error) {

		logger.error("error updating message: ", error);
		return null;
	}
};

