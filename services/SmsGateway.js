const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(ACCOUNT_SID, AUTH_TOKEN);
const axios = require('axios')
const {TWILIO_GATEWAY, BULKGATE_GATEWAY} = require("../constants")


/**
 * Sends messages using the configured sms gateway
 * @param {String} recipient - phone number to receive the message
 * @param {String} message - message body
 * @param {String} sender_name - message sender name
 * @param {Object} gateway - configured sms gateway
 * @returns
 */
exports.send = async (recipient, message, sender_name, gateway) => {
    try {

        if (gateway === TWILIO_GATEWAY) {
            return await this.twilioSend(message, recipient, sender_name)
        } else if (gateway === BULKGATE_GATEWAY) {
            return await this.bulkGateSend(message, recipient, sender_name)
        }

        console.log("gateway not configured")
        return null
    } catch (error) {
        console.log("error send: ", error)
        return null
    }
}

/**
 * Sends a message using the 'Twilio' sms gateway
 * @param {*} message - message body
 * @param {*} recipient - number to recipient message
 * @param {*} sender_name - message sender name
 * @returns {Promise}
 */
exports.twilioSend = async (message, recipient, sender_name) => {
    try {

        if (message && recipient && sender_name) {
            let payload = {
                body: message,
                to: recipient, // Text this number
                from: sender_name, // From a valid Twilio number
            };

            if (process.env.NODE_ENV === "production") {
                Object.assign(payload, {
                    statusCallback: "https://developer.lonotalk.com/api/v1/sms/status",
                });
            }

            let result = await client.messages.create(payload)

            if (result) return {
                status: result.status,
                id: result.sid
            }

            return null
        }

        return null
    } catch (error) {

        console.log("error twilio send: ", error)

        return null
    }

};

/**
 * Sends a message using the 'Bulkgate' sms gateway
 * @param {String} message - message body
 * @param {String} recipient - number to recipient message
 * @param {String} sender_name - message sender name
 * @returns {Promise}
 */
exports.bulkGateSend = async (message, recipient, sender_name) => {
    try {

        if (message && recipient && sender_name) {

            let result = await axios.post(`${process.env.BULKGATE_BASEURL}/transactional`, {
                application_id: process.env.BULKGATE_APP_ID,
                application_token: process.env.BULKGATE_APP_TOKEN,
                number: recipient,
                text: message,
                sender_id: "gText",
                sender_id_value:sender_name,
                tag: sender_name,
                duplicates_check: "on",
                country: "LR"
            })

            if (result.data) return {
                status: result.data?.data?.status,
                id: result.data?.data?.sms_id
            }

            return null
        }

        return null

    } catch (error) {
        console.log("error bulkGateSend: ", error)
        return null
    }
}
