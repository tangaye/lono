const Message = require("../models/Message")
const Queue = require("../Queue")
const { v4: uuidv4 } = require("uuid")
const constants = require("../constants")
const MessageFactory = require("../factories/MessagesFactory")
const logger = require("../logger")
const helper = require("../helpers")
const database = require("../database/connection");
const {Op, QueryTypes} = require("sequelize");
const ContactFactory = require("../factories/ContactsFactory")
const MessagePart = require("../models/MessagePart");
const { response } = require("express")
const Gateway = require("../models/Gateway")


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

		const count = await Message.count({
			where: {sender_id: {[Op.in]: senders}},
			distinct: true
		})

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

		const { sender, messages, user } = request.body;
		const queued_messages = []

		for (const item of messages) {

			const message_id = uuidv4()
			const contact = await ContactFactory.createContact({msisdns: [item.to], user})
			const msisdn = contact ? contact.msisdns.find(msisdn => msisdn.id === item.to) : item.to
			const parts = MessageFactory.breakIntoParts(item.body, 160)
			const credits = constants.SMS_TARIFF * parts.length
			const queue = helper.getMessageQueue(item.to)
			const gateway = await Gateway.findOne({where: {slug: queue.split("_")[0]}})

			console.log({gateway})

			const message = await Message.create({
				id: message_id,
				message: item.body,
				msisdn_id: msisdn.id,
				sender_id: sender.id,
				gateway_id: gateway.id,
				user_id: user.id,
				credits
			})

			await Queue.add({
				body: item.body,
				to: item.to,
				sender: sender.name,
				message_id: message.id,
				user_id: user.id,
				credits,
				parts
			}, queue)

			queued_messages.push({
				smsId: message_id,
				recipient: item.to,
				message: item.body,
				credits,
				sender,
				extMessageId: item.extMessageId
			})
		}

		return response.send({
			errorCode: constants.SUCCESS_CODE,
			messages: queued_messages,
		});



	} catch (error) {

		logger.error("error sending messages test: ", error);

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

        const {status, price, smsID} = request.query

        const bulkgate_statuses = [
            {code: 1, name: "delivered"},
            {code: 2, name: "pending"},
            {code: 3, name: "failed"}
        ]

        if (smsID) {


            const message = await Message.findOne({where: {
                gateway_message_id: smsID
            }})

            const message_status = bulkgate_statuses.find(item => item.code === Number(status))

            if (message) await message.update({status: message_status.name})
        }

        return response.send({ ok: 200 })
    } catch (error) {
        logger.error("error updating bulkgate message status: ", error);
		return response.status(constants.SERVER_ERROR).send({ failure: constants.SERVER_ERROR });
    }
}

exports.handleOrangeDR = async (request, response) =>
{
	try {

		console.log("request body: ", request.body)
		const delivery_notification = request.body?.deliveryInfoNotification

		if (delivery_notification) 
		{
			const resource_id = delivery_notification?.callbackData
			const message_status = delivery_notification?.deliveryInfo?.delivery?.deliveryStatus

			if (resource_id && message_status)
			{
				let status = constants.PENDING_STATUS

				switch (message_status) {
					case "DeliveredToNetwork":
					case "DeliveryUncertain":
					case "MessageWaiting": // still queued for delivery
					default:
						status = constants.PENDING_STATUS
						break;
					case "DeliveryImpossible": // recipient phone out of battery or not active
					case "DeliveredToTerminal": // message delivered
						status = constants.DELIVERED_STATUS
						break;
				}

				const result = await Message.update({status},
					{ where: { gateway_message_id: resource_id }, returning: true }
				)
	
				console.log('Orange message status updated', result[1])
			}

		}

		return response.send({ ok: 200 })

	} catch (error) {

		logger.error("error updating orange message status: ", error);
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
                { where: { gateway_message_id: message_sid }, returning: true }
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

