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
				error_code: SUCCESS_CODE,
				clients: clients,
			});
		}

		return response.send({
			error_code: FAILURE_CODE,
			error_message: "error fetching clients",
			clients: [],
		});
	} catch (error) {
		console.log("error fetching clients: ", error);
		return response.status(SERVER_ERROR).send({
			error_code: FAILURE_CODE,
			error_message: "error fetching clients",
			clients: [],
		});
	}
};
