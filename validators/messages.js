const constants = require("../constants")
const MsisdnsFactory = require("../factories/MsisdnsFactory")
const logger = require("../logger")
const helper = require("../helpers")


/**
 * Validates and prepares requests to display apps
 * @param {Request} request
 * @param {Response} response
 * @param {next} next
 * @returns
 */
exports.validateAll = (request, response, next) => {

    const id = request.query.id;

    if (id && !helper.isValidUuid(id)) return helper.respond(response, {message: "invalid id"})

    return next()
}

/**
 * Validates export
 * @param {Request} request
 * @param {Response} response
 * @param {next} next
 * @returns
 */
exports.validateExport = (request, response, next) => {


    let {msisdns, start_date, end_date} = request.body

    if (
        (start_date && !helper.isValidDate(start_date)) || (end_date && !helper.isValidDate(end_date))
        )
    {
        return helper.respond(response, {
            code: constants.INVALID_DATA,
            message: "Invalid date"
        }, 400)
    }

    if (start_date) start_date = new Date(start_date).toISOString().slice(0, 10)

    if (end_date) end_date = new Date(end_date).toISOString().slice(0, 10)

    if (start_date && end_date)
    {
        if (end_date < start_date) return helper.respond(response, {
            code: constants.INVALID_DATA,
            message: "Invalid date range"
        }, 400)
    }

    request.body.msisdns = msisdns?.length > 0 ? msisdns : null;
    request.body.end_date = end_date || null;
    request.body.start_date = start_date || null;

    return next()
}

/**
 * Validates and prepares requests to store apps
 * @param {Request} request
 * @param {Response} response
 * @param {next} next
 * @returns
 */
exports.validateStore = async (request, response, next) => {

    try {

        const { sender, messages, user } = request.body;

        if (sender && messages && user) {

            const result = await validate(messages, user)

            if (result.valid) return next ()

            return helper.respond(response, {
                code: constants.INVALID_DATA,
                message: result.message
            })

        }

        return helper.respond(response, {
            code: constants.INVALID_DATA,
            message: "messages, sender & user are required"
        })


    } catch (error) {

        const message = "error validating data to create messages"

        logger.error(message, error)

        return helper.respond(response, {
            code: constants.FAILURE_CODE,
            message
        })

    }
}

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
const validate = async (data, user) => {

    const result = {valid: false}

    try {

        const msisdns = data.map(message => message.to).filter(msisdn => msisdn !== undefined)
        const messages = data.map(message => message.body).filter(message => message !== undefined)

        const msisdns_valid = MsisdnsFactory.validate(msisdns)
        const messages_valid = validateMessages(messages)
        const valid_credits = validateUserCredits(user)

        if (msisdns_valid && messages_valid && valid_credits) {
            result.user = user
            result.valid = true
        }


        if (!msisdns_valid) result.message = "Invalid phone number(s). Phone number(s) should be of 12 characters. Ex: 213889998009 or 231778909890"
        if (!messages_valid) result.message = "Invalid message(s). A message to a phone number should be 1 - 160 characters."
        if (!valid_credits) result.message = "Insufficient credits"

        return result

    } catch (error) {

        logger.error("error validate: ", error)

        result.message = "error validating request"

        return result
    }
}