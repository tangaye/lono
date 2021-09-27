const User = require("../models/User")
const Sender = require("../models/Sender")
const { SUCCESS_CODE, SERVER_ERROR, FAILURE_CODE, NOTFOUND } = require("../constants")

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
		console.log("error fetching users: ", error);
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
        console.log("getAccountDetails: ", error)
        return response.status(SERVER_ERROR).send({
			errorCode: FAILURE_CODE,
			errorMessage: "error getting user details",
			user: null,
		});
    }
}
