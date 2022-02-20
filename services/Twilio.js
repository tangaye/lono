const twilio = require("twilio")
const logger = require("../logger");

/**
 * Send messages using the Twilio SMS gateway
 * @class Twilio
 */
class Twilio {

	client = null
	accountSid = process.env.TWILIO_ACCOUNT_SID
	authToken = process.env.TWILIO_AUTH_TOKEN
	isProduction = process.env.NODE_ENV === "production"
	prodCallbackUrl = "https://developer.lonotalk.com/api/v1/sms/status"

	/**
	 * message recipient
	 * @type {string}
	 */
	to = ""

	/**
	 * message text
	 * @type {string}
	 */
	body = ""

	/**
	 * message sender
	 * @type {string}
	 */
	from = ""

	/**
	 *
	 * @param recipient
	 * @param message
	 * @param sender
	 */
	constructor(recipient, message, sender) {
		this.to = recipient
		this.body = message
		this.from = sender
		this.client = new twilio(this.accountSid, this.authToken)
	}

	/**
	 * Send message
	 * @return {Promise<null|{id: *, status: *}>}
	 */
	async send () {

		try {

			if (!this.validatePayload()) return null

			const payload = {body: this.body, to: this.to, from: this.from}

			if (this.isProduction) payload.statusCallback = this.prodCallbackUrl

			const result = await this.client.messages.create(payload)

			if (result) return {
				status: result?.status,
				id: result?.sid
			}

			return null
		}
		catch (error)
		{
			logger.log("error twilio send: ", error)
			return null
		}
	}

	/**
	 * validates data
	 * @return {""|null}
	 */
	validatePayload() {
		return (this.to && this.body && this.from && this.client)
	}

}

module.exports = Twilio