const ContactFactory = require("../factories/ContactsFactory")
const database = require("../database/connection")
const {QueryTypes} = require("sequelize")
const constants = require("../constants")
const helper = require("../helpers")
const logger = require("../logger")

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

		const contact = await ContactFactory.createContact({
			first_name,
			middle_name,
			last_name,
			metadata,
			msisdns,
			groups,
			user
		})

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


/**
 * Returns all contacts for a user
 * @param request
 * @param response
 * @return {Promise<*>}
 */
exports.allWithoutSearch = async (request, response) => {

	try {

		const user = request.body.user

		const contacts = await database.query(`
			SELECT
				   contacts.id,
				   first_name,
				   middle_name,
				   last_name,
				   contacts.created_at,
				   json_agg(json_build_object('id', cmu.msisdn_id)) as msisdns,
				   (
						SELECT json_agg(json_build_object('id', g.id, 'name', g.name))
						FROM contact_groups
						LEFT JOIN groups g ON g.id = contact_groups.group_id
						WHERE contact_groups.contact_id = contacts.id AND g.user_id = :user_id
				   ) AS groups
			FROM contacts
			INNER JOIN contact_msisdns_users cmu on contacts.id = cmu.contact_id
			WHERE cmu.user_id = :user_id
			GROUP BY id
		`, {
			replacements: {user_id: user.id},
			type: QueryTypes.SELECT
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