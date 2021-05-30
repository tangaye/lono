const Client = require("../models/Client");
const Sender = require("../models/Sender");
const {
	UNAUTHORIZED,
	SERVER_ERROR,
	FAILURE_CODE,
	NOTFOUND,
} = require("../constants");

exports.setSender = async (request, response, next) => {
	// request headers and case-insensitive
	let apiKey = request.headers.apikey;

	try {
		if (apiKey) {
			let client = await Client.findOne({
				include: {
					model: Sender,
				},
				where: {
					api_key: apiKey,
				},
			});

			if (client) {
				client = JSON.parse(JSON.stringify(client));
				request.body.client = client;
				return next();
			}

			return response.status(UNAUTHORIZED).send({
				errorCode: FAILURE_CODE,
				errorMessage: `Unauthorized!`,
			});
		}

		return response.status(UNAUTHORIZED).send({
			errorCode: FAILURE_CODE,
			errorMessage: `Unauthorized!`,
		});
	} catch (error) {
		console.log("error finding client: ", error);

		return response.status(SERVER_ERROR).send({
			errorCode: FAILURE_CODE,
			errorMessage: `An unexpected error occured.`,
		});
	}
};

exports.isValidSender = async (request, response, next) => {
	try {
		let client = request.body.client;
		let senderName = request.body.senderName;
		let sender = client.senders.find((item) => item.name === senderName);

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
