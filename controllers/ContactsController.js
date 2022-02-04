const User = require("../models/User")
const Msisdn = require("../models/Msisdn")
const Contact = require("../models/Contact")
const Group = require("../models/Group")
const ContactFactory = require("../factories/ContactsFactory")
const logger = require("../logger")
const constants = require("../constants")
const helper = require("../helpers")

exports.all = async (request, response) => {

	try {

		const {user, where_clause} = request.body

		const contacts = await Contact.findAll({
			attributes: ['id', 'first_name', 'middle_name', 'last_name', 'created_at'],
			include: [
				{
					model: User,
					attributes: ['id', 'name'],
					through: {attributes: []},
					where: {id: user.id}
				},
				{
					model: Group,
					attributes: ['id', 'name'],
					through: {attributes: []}
				},
				{
					model: Msisdn,
					attributes: ['id'],
					through: {attributes: []},
				}
			],
			order: [['created_at', 'desc']],
			where: where_clause || null
		})

		if (contacts) return helper.respond(response, {
			code: constants.SUCCESS_CODE,
			contacts
		})

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: "error fetching contacts"
		})
	}
	catch (error)
	{
		const message = "error fetching contacts"

		logger.log(message, error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: error?.errors ? error?.errors[0]?.message : message
		})
	}

}

exports.store = async (request, response) => {

	try {

		const {first_name, middle_name, last_name, metadata, msisdns, groups, user} = request.body
		const contact = await ContactFactory.createContact(first_name, middle_name, last_name, metadata, msisdns, groups, user)

		if (contact) return helper.respond(response, {
			code: constants.SUCCESS_CODE,
			contact
		})

		console.log({contact})

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: "error creating contact"
		})

	}
	catch (error)
	{
		const message = "error creating contact"

		logger.log(message, error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: error?.errors ? error?.errors[0]?.message : message
		})
	}
}
