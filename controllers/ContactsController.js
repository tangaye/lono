const Contact = require("../models/Contact")
const ContactFactory = require("../factories/ContactsFactory")
const database = require("../database/connection")
const logger = require("../logger")
const constants = require("../constants")
const helper = require("../helpers")
const {QueryTypes} = require("sequelize")

exports.all = async (request, response) => {

	try {

		const user = request.body.user
		const { page, size, search, order, id} = request.query
		const { limit, offset} = helper.getPagination(page, size)

		const replacements = ContactFactory.buildReplacements(user.id, id, limit, offset)
		const query_string = ContactFactory.queryContacts(search, id, user.id, order)

		const count_result = await database.query(`
			SELECT count(distinct contact_id)
			FROM contact_msisdns_users
			WHERE user_id = :user_id
		`, {
			replacements: {user_id: user.id},
			type: QueryTypes.SELECT
		})

		if (count_result) {

			const count = Number(count_result[0].count)
			const results = await database.query(query_string, {
				replacements,
				type: QueryTypes.SELECT
			})

			if (results) return helper.respond(response, {
				code: constants.SUCCESS_CODE,
				...ContactFactory.getPagingData(results, count, page, limit)
			})
		}

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