const Group = require("../models/Group")
const GroupFactory = require("../factories/GroupsFactory")
const constants = require("../constants")
const logger = require("../logger")
const helper = require("../helpers")
const database = require("../database/connection")
const {QueryTypes} = require("sequelize")

exports.all = async (request, response) => {

	try {

		const {user} = request.body
		const { page, size, search, order, id } = request.query
		const { limit, offset} = helper.getPagination(page, size)

		const replacements = GroupFactory.buildReplacements(user.id, id, search, limit, offset)
		const query_string = GroupFactory.queryGroups(search, id, order)

		const count = await Group.count({
			where: {user_id: user.id},
			distinct: true
		})

		const results = await database.query(query_string, {
			replacements,
			type: QueryTypes.SELECT
		})

		if (results) return helper.respond(response, {
			code: constants.SUCCESS_CODE,
			...GroupFactory.getPagingData(results, count, page, limit)
		})

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: "error fetching groups"
		})

	}
	catch (error)
	{
		const message = "error fetching groups"
		logger.error(message, error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: error?.errors ? error?.errors[0]?.message : message
		})
	}

}

exports.store = async (request, response) => {

	try
	{
		const {name, description, user} = request.body

		const group = await Group.create({name, description, user_id: user.id})

		if (group) return helper.respond(response, {
			code: constants.SUCCESS_CODE,
			group
		})

		return response.send({
			errorCode: constants.FAILURE_CODE,
			message: "error creating group"
		})
	}
	catch (error)
	{
		const message = "error fetching groups"
		logger.error(message, error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: error?.errors ? error?.errors[0]?.message : message
		})
	}
}