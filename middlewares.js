const User = require("./models/User")
const Sender = require("./models/Sender")
const constants = require("./constants")

/**
 * Only admins with app's api key are allowed
 * @param {*} request
 * @param {*} response
 * @param {*} next
 * @returns
 */
exports.requiresAdmin = async (request, response, next) => {

    try {

        let api_key = request.headers.apikey

        if (api_key && api_key === process.env.API_KEY) return next()

        return response.status(constants.UNAUTHORIZED).send({
            errorCode: constants.FAILURE_CODE,
            errorMessage: "Unauthorized!",
        })

    } catch (error) {

        console.log("error requiresAdmin: ", error)

        return response.status(constants.UNAUTHORIZED).send({
            errorCode: constants.FAILURE_CODE,
            errorMessage: "Unauthorized!",
        })
    }
}

/**
 * Only users with valid api key and user id are allowed
 * @param {*} request
 * @param {*} response
 * @param {*} next
 */
exports.userIsValid = async (request, response, next) => {

    // request headers and case-insensitive
	try {

        let api_key = request.headers.apikey

        if (api_key) {

            let user = await User.findOne({
                where: {api_key},
                include: {model: Sender, attributes: ['id', 'name']}
            })

            if (user) {

                request.user = user
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
		console.log("error finding user: ", error);

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

		let user = request.user;
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

		console.log(error);
		return response.status(constants.SERVER_ERROR).send({
			errorCode: constants.FAILURE_CODE,
			errorMessage: `An unexpected error ocurred.`,
		});
	}
};