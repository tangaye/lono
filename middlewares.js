const User = require("./models/User")
const Sender = require("./models/Sender")
const constants = require("./constants")
const logger = require("./logger")
const helper = require("./helpers")

/**
 * Only admins
 * @param {*} request
 * @param {*} response
 * @param {*} next
 * @returns
 */
exports.isAdmin = async (request, response, next) => {

    try {

        const user = request.body.user

        if (user.role === constants.ADMIN_ROLE) return next()

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: "Unauthorized!"
		}, constants.UNAUTHORIZED)


    } catch (error) {

        logger.error("error isAdmin: ", error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: "Unauthorized!"
		}, constants.UNAUTHORIZED)
    }
}

/**
 * Only users with a valid api key
 * @param {*} request
 * @param {*} response
 * @param {*} next
 */
exports.authenticate = async (request, response, next) => {

    // request headers and case-insensitive
	try {

        const api_key = request.headers.apikey

        if (api_key) {

            const user = await User.findOne({
                where: {api_key},
                include: {model: Sender, attributes: ['id', 'name']}
            })

            if (user) {
                request.body.user = user
                return next()
            }

        }

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: "Unauthorized!"
		}, constants.UNAUTHORIZED)


	} catch (error) {

		logger.error("error authentication request: ", error);

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: "An unexpected error occurred."
		}, constants.UNAUTHORIZED)
	}
}

/**
 * API user sender name is valid
 * @param {*} request
 * @param {*} response
 * @param {*} next
 * @returns
 */
exports.senderIsValid = async (request, response, next) => {
	try {

		console.log({
			requestBody: request.body,
			requestHeaders: request.headers
		})
		
		const {user, senderName} = request.body
		const sender = user.senders.find((item) => item.name === senderName);

		if (sender) {
			request.body.sender = sender;
			return next();
		}

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: `Invalid senderName: '${senderName}'.`,
		})

	} catch (error) {

		logger.error("error senderIsValid", error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: "An unexpected error occurred."
		}, constants.UNAUTHORIZED)
	}
};