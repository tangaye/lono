const User = require("../models/User")
const Msisdn = require("../models/Msisdn")
const Contact = require("../models/Contact")
const ContactMsisdnUser = require("../models/ContactMsisdnUser")
const database = require("../database/connection")
const MsisdnFactory = require("../factories/MsisdnsFactory")
const logger = require("../logger")
const constants = require("../constants")

exports.all = async (request, response) => {

	try {

		const user = request.body.user

		const contacts = await Contact.findAll({
			include: [
				{
					model: User,
					through: {attributes: []},
					where: {id: user.id}
				}, {
					model: Msisdn,
					through: {attributes: []},
				}
			]
		})

		if (contacts) return response.send({
			errorCode: constants.SUCCESS_CODE,
			contacts
		})

		return response.send({
			errorCode: constants.FAILURE_CODE,
			message: "error fetching contacts"
		})
	}
	catch (error)
	{
		const message = "error fetching contacts"
		logger.error(message, error)

		return response.status(constants.SERVER_ERROR).send({
			errorCode: constants.FAILURE_CODE,
			errorMessage: error?.errors[0]?.message || message
		})
	}

}

exports.store = async (request, response) => {

	try {

		const user = request.body.user
		const {first_name, middle_name, last_name, metadata, msisdns} = request.body

		if (MsisdnFactory.validate(msisdns)) {

			const result = await database.transaction(async (t) => {

				// create msisdns
				const prepared_msisdns = msisdns.map(msisdn => ({id: msisdn}))
				const created_msisdns = await Msisdn.bulkCreate(prepared_msisdns, {transaction: t})

				// create contact
				const contact = await Contact.create({
					first_name, middle_name, last_name, metadata
				}, { transaction: t })

				// assign msisdn, contact to user
				for (const msisdn of created_msisdns) {

					await ContactMsisdnUser.create({
						contact_id: contact.id, msisdn_id: msisdn.id, user_id: user.id
					}, {transaction: t})
				}

				return contact;

			});

			if (result) return response.send({
				errorCode: constants.SUCCESS_CODE,
				contact: result
			})
		}

		return response.send({
			errorCode: constants.FAILURE_CODE,
			message: "Invalid msisdns"
		})

	}
	catch (error)
	{
		const message = "error creating contacts"
		logger.error(message, error)

		return response.status(constants.SERVER_ERROR).send({
			errorCode: constants.FAILURE_CODE,
			errorMessage: error?.errors[0]?.message || message
		})
	}
}
