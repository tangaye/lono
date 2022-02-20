const helper = require("../helpers")
const constants = require("../constants")
const logger = require("../logger")

/**
 * Validates and prepares requests to display apps
 * @param {Request} request
 * @param {Response} response
 * @param {next} next
 * @returns
 */
exports.validateAll = (request, response, next) => {

	const id = request.query.id;

	if (id && !helper.isValidUuid(id)) {
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

		const {name, user} = request.body

		if (name && user) return next()


		return helper.respond(response, {
			code: constants.INVALID_DATA,
			message: "name and user are required"
		})


	} catch (error) {

		logger.error("error validating data to store group: ", error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: "error validating data to store group"
		})

	}
}