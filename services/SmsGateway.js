const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(ACCOUNT_SID, AUTH_TOKEN);

/**
 * Sends a message using the 'Twilio' sms gateway
 * @param {*} message - message body
 * @param {*} recipient - number to recipient message
 * @param {*} senderName - message sender name
 * @returns {Promise}
 */
exports.send = async (message, recipient, senderName) => {
	let payload = {
		body: message,
		to: `+231${recipient.substring(1)}`, // Text this number
		from: senderName, // From a valid Twilio number
	};

	if (process.env.NODE_ENV === "production") {
		Object.assign(payload, {
			statusCallback: "https://developer.lonotalk.com/api/v1/sms/status",
		});
	}

	return await client.messages.create(payload);
};
