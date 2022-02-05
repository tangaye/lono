const Group = require("../models/Group")
const GroupFactory = require("../factories/GroupsFactory")
const constants = require("../constants")
const logger = require("../logger")
const helper = require("../helpers")
const MessageFactory = require("../factories/MessagesFactory");

exports.all = async (request, response) => {

	try {

		const {user} = request.body
		const { page, size, search, order, id } = request.query
		const { limit, offset} = helper.getPagination(page, size)

		const groups = await Group.findAndCountAll({
			attributes: ['id', 'name', 'description', 'created_at'],
			where: GroupFactory.getWhereClause(user.id, search, id),
			order: [['created_at', helper.getOrder(order)]],
			limit,
			offset
		})

		if (groups) return helper.respond(response, {
			code: constants.SUCCESS_CODE,
			...GroupFactory.getPagingData(groups, page, limit)
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