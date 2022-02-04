const User = require("./models/User")
const Sender = require("./models/Sender")
const constants = require("./constants")
const logger = require("./logger");

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

        return response.status(constants.UNAUTHORIZED).send({
            errorCode: constants.FAILURE_CODE,
            errorMessage: "Unauthorized!",
        })

    } catch (error) {

        logger.error("error isAdmin: ", error)

        return response.status(constants.UNAUTHORIZED).send({
            errorCode: constants.FAILURE_CODE,
            errorMessage: "Unauthorized!",
        })
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

            return response.status(constants.UNAUTHORIZED).send({
                errorCode: constants.FAILURE_CODE,
                errorMessage: "Unauthorized!",
            })
        }

        return response.status(constants.UNAUTHORIZED).send({
            errorCode: constants.FAILURE_CODE,
            errorMessage: "Unauthorized!",
        })


	} catch (error) {

		logger.error("error authentication request: ", error);

		return response.status(constants.SERVER_ERROR).send({
			errorCode: constants.FAILURE_CODE,
			errorMessage: `An unexpected error occurred.`,
		})
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

		let user = request.body.user;
		let senderName = request.body.senderName;
		let sender = user.senders.find((item) => item.name === senderName);

		if (sender) {
			request.body.sender = sender;
			return next();
		}

		return response.send({
			errorCode: constants.FAILURE_CODE,
			errorMessage: `Invalid senderName: '${senderName}'.`,
		});

	} catch (error) {

		logger.error("error senderIsValid", error)

		return response.status(constants.SERVER_ERROR).send({
			errorCode: constants.FAILURE_CODE,
			errorMessage: `An unexpected error occurred.`,
		});
	}
};