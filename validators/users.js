const helper = require("../helpers")
const constants = require("../constants")
const User = require("../models/User")
const { Op } = require("sequelize")
const logger = require("../logger")

/**
 * Validates and prepares requests to display apps
 * @param {Request} request
 * @param {Response} response
 * @param {next} next
 * @returns
 */
exports.validateAll = (request, response, next) => {

	let id = request.query.id;

	if (id && helper.isValidUuid(id)) {
		request.body.where_clause = {id}
	} else if (id && !helper.isValidUuid(id)) {
		return helper.respond(response, {message: "invalid id"})
	}

	return next()
}

/**
 * Validates and prepares requests to store apps
 * @param {Request} request
 * @param {Response} response
 * @param {next} next
 * @returns
 */
exports.validateStore = async (request, response, next) => {

	try {

		const {name, email, credits} = request.body

		if (name && (Number(credits) >= 0) && email && helper.isValidEmail(email)) {

			const user = await User.findOne({
				where: {
					[Op.or]: [
						{name},
						{email}
					]
				}
			})

			if (user) return helper.respond(response, {
				code: constants.INVALID_DATA,
				message: "user exists"
			})

			request.body.api_key = helper.generateSecret()
			request.body.password = helper.generateSecret()

			return next()
		}

		return helper.respond(response, {
			code: constants.INVALID_DATA,
			message: "invalid name, credits or email"
		})


	} catch (error) {

		logger.error("error validating data to store user: ", error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: "error validating data to store user"
		})

	}
}