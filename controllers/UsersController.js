const User = require("../models/User")
const Sender = require("../models/Sender")
const { SUCCESS_CODE, SERVER_ERROR, FAILURE_CODE, NOTFOUND, SMS_TARIFF } = require("../constants")
const logger = require("../logger")

exports.all = async (request, response) => {
	try {
		let users = await User.findAll({
			attributes: ["id", "name", "credits", "allow_overdraft", ["api_key", "apiKey"]],
			include: { model: Sender, attributes: ["id", "name"] },
		});
		if (users) {
			return response.send({
				errorCode: SUCCESS_CODE,
				users: users,
			});
		}

		return response.send({
			errorCode: FAILURE_CODE,
			errorMessage: "error fetching users",
			users: [],
		});
	} catch (error) {
		logger.log("error fetching users: ", error);
		return response.status(SERVER_ERROR).send({
			errorCode: FAILURE_CODE,
			errorMessage: "error fetching users",
			users: [],
		});
	}
};

exports.getAccountDetails = async (request, response) => {
    try {
        if (request.user) {

            let user = request.user

            return response.send({
				errorCode: SUCCESS_CODE,
				user: {
                    id: user.id,
                    name: user.name,
                    apiKey: user.api_key,
                    senderNames: user.senders,
                    smsCredits: user.credits
                }
			})

        }

        return response.status(NOTFOUND).send({errorCode: FAILURE_CODE, message: "user not found"})

    } catch (error) {
        logger.log("getAccountDetails: ", error)
        return response.status(SERVER_ERROR).send({
			errorCode: FAILURE_CODE,
			errorMessage: "error getting user details",
			user: null,
		});
    }
}

/**
 * Updates the user credits
 * @param {UUID} id - user id
 * @returns
 */
exports.updateCredits = async id => {
    try {

        let user = await User.findByPk(id)
        if (user) {

            let credits = user.credits - SMS_TARIFF

            // round numbers to 2 decimal places
            if (credits >= 0) {
                credits = Math.floor(credits * 100) / 100
            } else {
                credits = Math.ceil(credits * 100) / 100
            }

            return await user.update({credits})
        }

        return

    } catch (error) {
        logger.log("error updateCredits: ", error)
        return
    }
}
