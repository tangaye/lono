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
				error_code: FAILURE_CODE,
				error_message: `Unauthorized! api key: '${apiKey}' not found.`,
			});
		}

		return response.status(UNAUTHORIZED).send({
			error_code: FAILURE_CODE,
			error_message: `Unauthorized!`,
		});
	} catch (error) {
		console.log("error finding client: ", error);

		return response.status(SERVER_ERROR).send({
			error_code: FAILURE_CODE,
			error_message: `An unexpected error occured.`,
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
			error_code: FAILURE_CODE,
			error_message: `senderName: '${senderName}' not registered.`,
		});
	} catch (error) {
		console.log(error);
		return response.status(SERVER_ERROR).send({
			error_code: FAILURE_CODE,
			error_message: `An unexpected error ocurred.`,
		});
	}
};

exports.forDevOnly = (request, response, next) => {
	if (process.env.NODE_ENV === "production") {
		return response.status(NOTFOUND).send({
			error_code: FAILURE_CODE,
			error_message: `${request.originalUrl} not found`,
		});
	}

	return next();
};
