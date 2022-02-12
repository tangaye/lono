const User = require("../models/User")
const Msisdn = require("../models/Msisdn")
const Contact = require("../models/Contact")
const Group = require("../models/Group")
const ContactFactory = require("../factories/ContactsFactory")
const database = require("../database/connection")
const logger = require("../logger")
const constants = require("../constants")
const helper = require("../helpers")
const {Op, QueryTypes} = require("sequelize")

exports.all = async (request, response) => {

	try {

		const user = request.body.user
		const { page, size, search, order, id} = request.query
		const { limit, offset} = helper.getPagination(page, size)

		const replacements = ContactFactory.buildReplacements(user.id, id, limit, offset)
		const query_string = ContactFactory.buildQuery(search, id, order)

		const count = await Contact.count({distinct: true})
		const results = await database.query(query_string, {
			replacements,
			type: QueryTypes.SELECT
		})

		if (results) return helper.respond(response, {
			code: constants.SUCCESS_CODE,
			...ContactFactory.getPagingData(results, count, page, limit)
		})

		// return helper.respond(response, {
		// 	code: constants.FAILURE_CODE,
		// 	message: "error fetching contacts"
		// })
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

const populateItemGroups = results => {

	return results.map(item => {

		for (const [key, value] of Object.entries(item))
		{
			const split_key = key.split('.')

			if (split_key.length === 2)
			{
				const new_object = {}
				new_object[`${split_key[1]}`] = value

				item[split_key[0]].push(new_object)

				delete item[key]

			}
			else if (split_key.length === 1)
			{
				item[split_key[0]] = value
			}
			else
			{
				throw new Error('invalid field')
			}
		}

		return item
	})

}

const setupResultGroups = (results, groups) => {

	const data = []

	results.forEach(result => {

		const found = data.find(item => item.id === result.id)

		if (!found) {
			for (const group of groups) {
				if (!result.hasOwnProperty(group)) result[group] = []
			}

			data.push(result)
		}
	})

	return data

}

const prepareResults = (results, groups) => {
	results = setupResultGroups(results, groups)
	results = populateItemGroups(results)
	return results
}
