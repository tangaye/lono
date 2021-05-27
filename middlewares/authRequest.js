const Client = require("../models/Client");
const Sender = require("../models/Sender");
const {
	UNAUTHORIZED,
	SERVER_ERROR,
	FAILURE_CODE,
	NOTFOUND,
} = require("../constants");

exports.setSender = async (request, response, next) => {
	let api_key = request.headers.api_key;

	try {
		if (api_key) {
			let client = await Client.findOne({
				include: {
					model: Sender,
				},
				where: {
					api_key: api_key,
				},
			});

			if (client) {
				client = JSON.parse(JSON.stringify(client));
				request.body.client = client;
				return next();
			}

			return response.status(UNAUTHORIZED).send({
				error_code: FAILURE_CODE,
				error_message: `Unauthorized! api key: '${api_key}' not found.`,
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
		let sender_name = request.body.sender_name;
		let sender = client.senders.find((item) => item.name === sender_name);

		if (sender) {
			request.body.sender = sender;
			return next();
		}

		return response.status(NOTFOUND).send({
			error_code: FAILURE_CODE,
			error_message: `sender_name: '${sender_name}' not registered.`,
		});
	} catch (error) {
		console.log(error);
		return response.status(SERVER_ERROR).send({
			error_code: FAILURE_CODE,
			error_message: `An unexpected error ocurred.`,
		});
	}
};
