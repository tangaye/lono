const Client = require("../models/Client");
const Sender = require("../models/Sender");
const { SUCCESS_CODE, SERVER_ERROR, FAILURE_CODE } = require("../constants");

exports.all = async (request, response) => {
	try {
		let clients = await Client.findAll({
			attributes: ["id", "name", ["api_key", "apiKey"]],
			include: { model: Sender, attributes: ["id", "name"] },
		});
		if (clients) {
			return response.send({
				errorCode: SUCCESS_CODE,
				clients: clients,
			});
		}

		return response.send({
			errorCode: FAILURE_CODE,
			errorMessage: "error fetching clients",
			clients: [],
		});
	} catch (error) {
		console.log("error fetching clients: ", error);
		return response.status(SERVER_ERROR).send({
			errorCode: FAILURE_CODE,
			errorMessage: "error fetching clients",
			clients: [],
		});
	}
};
