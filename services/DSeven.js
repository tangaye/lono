const axios = require("axios")
const logger = require("../logger")

/**
 * Send messages using Bulkgate'S SMS API
 * @class DSeven
 *
 */
class DSeven {

    baseUrl = process.env.DSEVEN_BASEURL
    token = process.env.DSEVEN_TOKEN
    isProduction = process.env.NODE_ENV === "production"
    callbackURL = "https://developer.lonotalk.com/api/v1/sms/dseven/dr"

	axiosInstance = axios.create({
		baseURL: this.baseUrl,
        headers: {
            "Authorization": `Bearer ${this.token}`
        }
	})

    async send(recipient, message, senderName) {
        try {

            const data = {
                messages: [
                    {
                        channel: "sms",
                        recipients: [recipient],
                        content: message,
                        msg_type: "text",
                        data_encoding: "text"
                    }
                ],
                message_globals: {
                    "originator": senderName
                }
            }

            if (this.isProduction) data["report_url"] = this.callbackURL

            const result = await this.axiosInstance.post('/messages/v1/send', data)

            return {id: result.data.request_id}

        } catch (error) {

            logger.error("error sending sms from DSeven", error)
        }
    }

    async get(id) {
        try {

            if (!id) throw Error("Id is required")

            const result = await this.axiosInstance.get(`/messages/v1/message-log/${id}`)

            return result.data

        } catch (error) {

            logger.error("error getting message from d7", error)
        }
    }

    async getBalance() {

        try {

            const result = await this.axiosInstance.get('/messages/v1/balance')

            return {credits: result.data.balance}

        } catch (error) {

            logger.error("error getting balance from DSeven", error)
        }
    }
}

module.exports = DSeven