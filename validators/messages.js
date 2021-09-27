const {TWILIO_GATEWAY, BULKGATE_GATEWAY, SMS_TARIFF} = require("../constants")
const Gateway = require("../models/Gateway")

/**
 * Messages length should be <= 160
 * @param {Array} messages
 * @returns {Boolean}
 */
 const validateMessages = messages => {

    if (messages.length > 0) {

        for (message of messages) {

            let valid_message = message.length > 0 && message.length <= 160

            if (!valid_message) return false
        }
    }

	return true;
};

/**
 * Msisdn must be of length 12
 * Msisdn must be a valid orange or lonestar number
 * All values in msisdn should be an number/integer > 0. No characters allowed
 * @param {Array} msisdn
 * @returns {Boolean}
 */
 const validateMsisdns = msisdns => {

    if (msisdns.length > 0) {

        for (msisdn of msisdns) {

            msisdn = msisdn.trim()
            let valid_numbers = /^[0-9]*$/.test(msisdn)
            let starting_digits = msisdn.substring(0, 5)
            let valid_msisdn_starting = ["23177", "23188", "23155"].includes(starting_digits)
            let length_is_valid = msisdn.length === 12

            return valid_msisdn_starting && length_is_valid && valid_numbers
        }
    }

    return false
}

/**
 * Checks if an sms gateway has been configured
 * @returns {Boolean}
 */
const gatewayConfigured = async () => {

    try {
        let gateway = await Gateway.findOne({where: {active: true}})
        if (gateway) return gateway
        return false
    } catch (error) {
        logger.error("error gatewayConfigured: ", error)
        return false
    }
}

/**
 * Send sms only when api user has credits >= sms tariff
 * Send sms only when api user has is allowed overdraft and credits is <= sms tariff
 * @param {Object} user
 * @returns {Boolean}
 */
const validateUserCredits = user => {

    if (user.credits >= SMS_TARIFF) return true
    else if (user.credits < SMS_TARIFF && user.allow_overdraft) return true

    return false
}

/**
 * Validates messages
 * @param {Array} data
 * @param {Object} user - api user sending message
 * @returns {Object}
 */
exports.validate = async (data, user) => {

    try {

        let result = {valid: false}

        let msisdns = data.map(message => message.to).filter(msisdn => msisdn !== undefined)
        let messages = data.map(message => message.body).filter(message => message !== undefined)

        let msisdns_valid = validateMsisdns(msisdns)
        let messages_valid = validateMessages(messages)
        let gateway = await gatewayConfigured()
        let valid_credits = validateUserCredits(user)

        if (msisdns_valid && messages_valid && gateway && valid_credits) {
            result.gateway = gateway
            result.user = user
            result.valid = true
        }


        if (!msisdns_valid) result.message = "Invalid phone number(s). Phone number(s) should be of 12 characters. Ex: 213889998009 or 231778909890"

        if (!messages_valid) result.message = "Invalid message(s). A message to a phone number should be 1 - 160 characters."

        if (!valid_credits) result.message = "Insufficient credits"

        // todo: log to rollbar
        if (!gateway) result.message = "Unable to send message(s)"

        return result

    } catch (error) {
        logger.error("error validate: ", error)
        result.message = "error validating request"
        return result
    }
}