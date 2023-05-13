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
const Gateway = require("../models/Gateway")
const MessagePart = require("../models/MessagePart")


/**
 * Returns all messages for a user/sender
 * @param {*} request
 * @param {*} response
 * @returns
 */
exports.all = async (request, response) => {
	try {

		const user = request.body.user

		const { page, size, search, order, id } = request.query
		const { limit, offset} = helper.getPagination(page, size)

		const replacements = MessageFactory.buildReplacements(user.id, id, search, limit, offset)
		const query_string = MessageFactory.buildQuery(user.id, search, id, order)

		const count = await Message.count({
			where: {user_id: user.id},
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

exports.export = async(request, response) => {
    try {

        const user = request.body.user

        const { msisdns, start_date, end_date} = request.body

        const replacements = MessageFactory.buildExportReplacements(user.id, msisdns, start_date, end_date);

        const query_string = MessageFactory.buildExportQuery()

        const results = await database.query(query_string, {
			replacements,
			type: QueryTypes.SELECT
		})

		if (results) return helper.respond(response, {
			code: constants.SUCCESS_CODE,
			messages: results
		})

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: "error exporting messages"
		})

    } catch (error) {
        const message = "error getting data for export"

		logger.log(message, error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: error?.errors ? error?.errors[0]?.message : message
		})
    }
},

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

            const gateway = await MessageFactory.getGateway(item.to)

            if (!gateway) throw Error ('gateway not found')

            const message = await Message.create({
                id: message_id,
                message: item.body,
                msisdn_id: msisdn.id,
                sender_id: sender.id,
                gateway_id: gateway.id,
                user_id: user.id,
                credits
            })

            queued_messages.push({
                smsId: message_id,
                recipient: item.to,
                message: item.body,
                credits,
                sender,
                extMessageId: item.extMessageId
            })

            for (const text of parts)
            {

                Queue.add({
                    body: text,
                    to: item.to,
                    sender: sender.name,
                    message_id: message.id,
                    user_id: user.id,
                    credits
                }, gateway.queue)
            }

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

		if (!user) return helper.respond(response, {
			code: constants.SUCCESS_CODE,
			statistics: {
				total: 0,
				lastSeven: 0,
				latestFive: 0,
				totalToday: 0
			},
		})

		const last_seven_counts = await MessageFactory.lastSevenDaysCount(user.id)
		const total_today = await MessageFactory.totalToday(user.id)
		const total = await MessageFactory.total(user.id)
		const latest_five = await MessageFactory.latestFive(user.id)

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
			message: "error fetching stats"
		})
	}
	catch (error)
	{
		const message = "error fetching data"

		logger.error(message, error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: error?.errors ? error?.errors[0]?.message : message
		})

	}

}

exports.bulkgateDR = async (request, response) => {
    try {

        const {status, smsID} = request.query

        const bulkgate_statuses = [
            {code: 1, name: "delivered"},
            {code: 2, name: "pending"},
            {code: 3, name: "failed"}
        ]

        if (!(status && smsID)) throw Error("status, smsID not present in request")

        const part = await MessagePart.findOne({
            where: {gateway_message_id: smsID}
        })

        const message = await Message.findByPk(part.message_id)

        const message_status = bulkgate_statuses.find(item => item.code === Number(status))

        await Promise.all([
            message.update({status: message_status.name}),
            part.update({status: message_status.name})
        ])

        return response.sendStatus(200)
    } catch (error) {

        logger.error("error updating bulkgate message status: ", error);

		return response.sendStatus(500)
    }
}

exports.orangeDR = async (request, response) =>
{
	try {

		const {deliveryInfoNotification} = request.body

        if (!deliveryInfoNotification) throw Error("Key 'delivery_notification' not found in request body")

		const {callbackData, deliveryInfo} = deliveryInfoNotification
        const {deliveryStatus} = deliveryInfo

        if (!(callbackData)) throw Error("Key 'callbackData' not found in request body")

        const part = await MessagePart.findOne({
            where: {gateway_message_id: callbackData}
        })


        if (!part) throw Error("message not found")

        const message = await Message.findByPk(part.message_id)


        let status = constants.PENDING_STATUS

        switch (deliveryStatus) {
            case "DeliveredToNetwork":
            case "DeliveryImpossible": // recipient phone out of battery or not active
            case "DeliveredToTerminal": // message delivered
                status = constants.DELIVERED_STATUS
                break;
        }

        await Promise.all([
            message.update({status}),
            part.update({status})
        ])

		return response.sendStatus(200)

	} catch (error) {

		logger.error("error updating orange message status: ", error);

		return response.sendStatus(constants.SERVER_ERROR);
	}
}

exports.dsevenDR = async (request, response) =>
{
    try {

        const {request_id, status} = request.body

        if (!(request_id && status)) return response.sendStatus(400)

        const part = await MessagePart.findOne({where: {gateway_message_id: request_id
        }})

        if (!part) throw Error(`No message found for ${request_id} with status ${status}`)

        const message = await Message.findByPk(part.message_id)

        let message_status = constants.PENDING_STATUS
        switch (status) {
            case "undelivered":
                message_status = constants.FAILED_STATUS
                break;
            case "delivered":
                message_status = constants.DELIVERED_STATUS
                break;
        }

        await Promise.all([
            message.update({status: message_status}), part.update({status: message_status})
        ])

        return response.sendStatus(200)

    } catch (error) {

        logger.error("error handling dseven delivery report message status: ", error);

		return response.sendStatus(constants.SERVER_ERROR);
    }
}

/**
 * Twilio's method to update messages status
 * @param {*} request
 * @param {*} response
 * @returns {*} response
 */
 exports.twilioDR = async (request, response) => {
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

