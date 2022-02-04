const axios = require("axios")
const logger = require("../logger")

/**
 * Send messages using Bulkgate'S SMS API
 * @class Bulkgate
 *
 */
class Bulkgate {

	baseUrl = process.env.BULKGATE_BASEURL

	axiosInstance = axios.create({
		baseURL: this.baseUrl,
	})

	/**
	 * Bulkgate application id
	 * @type {string|process.env.BULKGATE_APP_ID}
	 */
	applicationId = process.env.BULKGATE_APP_ID

	/**
	 * Bulkgate app token
	 * @type {string|process.env.BULKGATE_APP_TOKEN}
	 */
	applicationToken = process.env.BULKGATE_APP_TOKEN

	/**
	 * message recipient country code
	 * @type {string|"LR"}
	 */
	country = "LR"

	senderId = "gText"

	tag = ""

	/**
	 * message recipient number
	 * @type {string}
	 */
	number = ""

	/**
	 * message text or body
	 * @type {string}
	 */
	text = ""

	/**
	 * message sender
	 * @type {string}
	 */
	sender_id_value = ""

	/**
	 *
	 * @param recipient
	 * @param message
	 * @param sender
	 */
	constructor(recipient, message, sender) {
		this.number = recipient
		this.text = message
		this.sender_id_value = sender
		this.tag = sender
	}

	async send () {

		try {

			if (!this.validatePayload()) return null

			const result = await this.axiosInstance.post('/transactional', {
				application_id: this.applicationId,
				application_token: this.applicationToken,
				number: this.number,
				text: this.text,
				sender_id: this.senderId,
				sender_id_value: this.sender_id_value,
				tag: this.tag,
				country: this.country
			})

			if (result.data) return {
				status: result.data?.data?.status,
				id: result.data?.data?.sms_id
			}

			return null
		}
		catch (error)
		{
			logger.log("error bulkGateSend: ", error)
			return null
		}
	}

	validatePayload() {
		return (this.number && this.text && this.sender_id_value)
	}

}

module.exports = Bulkgate