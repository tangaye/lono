const helper = require("../helpers")
const MsisdnFactory = require("../factories/MsisdnsFactory")
const GroupFactory = require("../factories/GroupsFactory")
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

	if (id && !helper.isValidUuid(id)) return helper.respond(response, {message: "invalid id"})

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

		const {msisdns, groups, user} = request.body

		if (msisdns && user) {

			const msisdns_valid = MsisdnFactory.validate(msisdns)
			const groups_valid = GroupFactory.groupsValid(groups)

			if (msisdns_valid && groups_valid) return next()

			return helper.respond(response, {
				code: constants.INVALID_DATA,
				message: "invalid msisdns"
			})

		}

		return helper.respond(response, {
			code: constants.INVALID_DATA,
			message: "msisdns & user are required"
		})


	} catch (error) {

		logger.error("error validating data to store contact: ", error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: "error validating data to store contact"
		})

	}
}