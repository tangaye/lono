const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(ACCOUNT_SID, AUTH_TOKEN);

/**
 * Sends a message using the 'Twilio' sms gateway
 * @param {*} message - message body
 * @param {*} recipient - number to recipient message
 * @param {*} sender_name - message sender name
 * @returns {Promise}
 */
exports.send = async (message, recipient, sender_name) => {
	return await client.messages.create({
		body: message,
		to: `+231${recipient.substring(1)}`, // Text this number
		from: sender_name, // From a valid Twilio number
	});
};
