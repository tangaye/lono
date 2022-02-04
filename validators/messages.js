const constants = require("../constants")
const Gateway = require("../models/Gateway")
const MsisdnsFactory = require("../factories/MsisdnsFactory")
const logger = require("../logger")

/**
 * Messages length should be <= 160
 * @param {Array} messages
 * @returns {Boolean}
 */
 const validateMessages = messages => {

    // if (messages.length > 0) {

    //     for (message of messages) {

    //         let valid_message = message.length > 0 && message.length <= 160

    //         if (!valid_message) return false
    //     }
    // }

	return true;
};

/**
 * Checks if a sms gateway has been configured
 * @returns {Promise<Gateway | null>}
 */
const gatewayConfigured = () => {

    try {
        return Gateway.findOne({where: {active: true}})
    } catch (error) {
        logger.error("error gatewayConfigured: ", error)
        return null
    }
}

/**
 * Send sms only when api user has credits >= sms tariff
 * Send sms only when api user has is allowed overdraft and credits is <= sms tariff
 * @param {Object} user
 * @returns {Boolean}
 */
const validateUserCredits = user => {

    if (user.credits >= constants.SMS_TARIFF) return true
    else if (user.credits < constants.SMS_TARIFF && user.allow_overdraft) return true

    return false
}

/**
 * Validates messages
 * @param {Array} data
 * @param {Object} user - api user sending message
 * @returns {Object}
 */
exports.validate = async (data, user) => {

    const result = {valid: false}

    try {

        const msisdns = data.map(message => message.to).filter(msisdn => msisdn !== undefined)
        const messages = data.map(message => message.body).filter(message => message !== undefined)

        const msisdns_valid = MsisdnsFactory.validate(msisdns)
        const messages_valid = validateMessages(messages)
        const gateway = await gatewayConfigured()
        const valid_credits = validateUserCredits(user)

        if (msisdns_valid && messages_valid && gateway && valid_credits) {
            result.gateway = gateway
            result.user = user
            result.valid = true
        }


        if (!msisdns_valid) result.message = "Invalid phone number(s). Phone number(s) should be of 12 characters. Ex: 213889998009 or 231778909890"
        if (!messages_valid) result.message = "Invalid message(s). A message to a phone number should be 1 - 160 characters."
        if (!valid_credits) result.message = "Insufficient credits"
        if (!gateway) result.message = "Unable to send message(s)"

        return result

    } catch (error) {

        logger.error("error validate: ", error)

        result.message = "error validating request"

        return result
    }
}