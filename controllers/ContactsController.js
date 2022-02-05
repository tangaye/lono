const User = require("../models/User")
const Msisdn = require("../models/Msisdn")
const Contact = require("../models/Contact")
const Group = require("../models/Group")
const ContactFactory = require("../factories/ContactsFactory")
const logger = require("../logger")
const constants = require("../constants")
const helper = require("../helpers")
const MessageFactory = require("../factories/MessagesFactory");

exports.all = async (request, response) => {

	try {

		const user = request.body.user
		const { page, size, search, order, id} = request.query
		const { limit, offset} = helper.getPagination(page, size)

		const contacts = await Contact.findAndCountAll({
			attributes: ['id', 'first_name', 'middle_name', 'last_name', 'created_at'],
			include: [
				{
					model: User,
					required: true,
					duplicating: false,
					attributes: ['id', 'name'],
					through: {attributes: []}
				},
				{
					model: Group,
					required: true, // required for top level where
					duplicating: false,
					attributes: ['id', 'name'],
					through: {attributes: []},
				},
				{
					model: Msisdn,
					required: true, // required for top level where
					duplicating: false, // required for top level where
					attributes: ['id'],
					through: {attributes: []},
				}
			],
			distinct: true,
			where: ContactFactory.getWhereClause(user.id, search, id) || null,
			order: [['created_at', helper.getOrder(order)]],
			limit,
			offset
		})

		console.log({contacts})

		if (contacts) return helper.respond(response, {
			code: constants.SUCCESS_CODE,
			...ContactFactory.getPagingData(contacts, page, limit)
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
