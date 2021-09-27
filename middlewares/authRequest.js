const User = require("../models/User");
const Sender = require("../models/Sender");
const {
	UNAUTHORIZED,
	SERVER_ERROR,
	FAILURE_CODE,
	NOTFOUND,
} = require("../constants");

exports.isValidSender = async (request, response, next) => {
	try {
		let user = request.body.user;
		let senderName = request.body.senderName;
		let sender = user.senders.find((item) => item.name === senderName);

		if (sender) {
			request.body.sender = sender;
			return next();
		}

		return response.status(NOTFOUND).send({
			errorCode: FAILURE_CODE,
			errorMessage: `senderName: '${senderName}' not configured.`,
		});
	} catch (error) {
		console.log(error);
		return response.status(SERVER_ERROR).send({
			errorCode: FAILURE_CODE,
			errorMessage: `An unexpected error ocurred.`,
		});
	}
};

exports.forDevOnly = (request, response, next) => {
	if (process.env.NODE_ENV === "production") {
		return response.status(NOTFOUND).send({
			errorCode: FAILURE_CODE,
			errorMessage: `${request.originalUrl} not found`,
		});
	}

	return next();
};

exports.validApiKey = (request, response, next) => {
    try {

        let apikey = request.headers.apikey;

        if (apikey === process.env.API_KEY) return next()

        return response.status(UNAUTHORIZED).send({
            errorCode: FAILURE_CODE,
            errorMessage: `Unauthorized!`,
        })

    } catch (error) {

        console.log("error validApiKey: ", error)

        return response.status(UNAUTHORIZED).send({
            errorCode: FAILURE_CODE,
            errorMessage: `Unauthorized!`,
        })
    }
}
