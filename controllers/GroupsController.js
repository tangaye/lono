const Group = require("../models/Group");
const constants = require("../constants");
const logger = require("../logger")
const helper = require("../helpers")

exports.all = async (request, response) => {

	try {

		const user = request.body.user

		const groups = await Group.findAll({
			attributes: ['id', 'name', 'description', 'created_at'],
			where: {user_id: user.id}
		})

		if (groups) return helper.respond(response, {
			code: constants.SUCCESS_CODE,
			groups
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

		if (name && description && user) {

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

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: "name, description & user are required"
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