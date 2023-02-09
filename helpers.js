const colors = require('colors')
const validator = require("validator")
const constants = require("./constants")
const generateApiKey = require('generate-api-key')

/**
 * Checks if url is valid
 * @param {String} url
 * @returns {Boolean}
 */
exports.isValidUrl = url => validator.isValidUrl(url)

/**
 * Checks if id is a uuid
 * @param {String} id
 * @returns {Boolean}
 */
exports.isValidUuid = id => validator.isUUID(id)


/**
 * Checks if id is a uuid
 * @param {string|required} email
 * @returns {Boolean}
 */
exports.isValidEmail = email => validator.isEmail(email)

/**
 * Checks if a sender name for SMS is a valid one.
 * Should be of length 11
 * Should contain chars a-z/A-Z
 * @param {String} name
 * @returns {Boolean}
 */
exports.isValidSenderName = name => {
	const alpha = /^[a-z]+$/i.test(name)
	const valid_length = name.length > 1 && name.length <= 11

	return alpha && valid_length
}

/**
 * Sends response to the user
 * @param {Response} response - response object
 * @param {Object} data - response data
 * @param {Number} status - Http response status, default is 200
 * @returns
 */
exports.respond = (response, data, status = 200) => response.status(status).send({data});



/**
 * Checks if required environment variables are set
 */
exports.checkEnvVariables = () => {

	constants.REQUIRED_ENV_VARIABLES.forEach(env => {
		if (!process.env[env]?.length > 0) {
			console.warn(colors.red(`ERROR: Missing the environment variable ${env}`))
			process.exit()
		}
	})

	constants.ENV_VARIABLES.forEach(env => {
		if (!process.env[env]?.length > 0) {
			console.warn(colors.yellow(`WARNING: Missing the environment variable ${env}`))
		}
	})

}

exports.generateSecret = () => generateApiKey({
	method: 'string',
	pool: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
	min: 64,
	max: 64
})

/**
 * Returns the message queue to use based on the msisdn passed
 * @param {string} msisdn 
 * @returns 
 */
exports.getMessageQueue = msisdn => {

	if (this.isLonestarMsisdn(msisdn)) return constants.BULKGATE_MESSAGES_QUEUE

	return constants.ORANGE_MESSAGES_QUEUE
}

exports.getOrderQuery = order => ` ORDER BY created_at ${order} `
exports.getLimitOffsetQuery = () => ` LIMIT :limit OFFSET :offset `

/**
 * gets pagination
 * @param page
 * @param size
 * @return {{offset: number, limit: number}}
 */
exports.getPagination = (page, size) => {
	const limit = size ? +size : 5;
	const offset = page ? page * limit : 0;

	return { limit, offset };
};


/**
 * Returns true if a number is a valid lonestar number
 * @param {string} msisdn 
 * @returns {Boolean|undefined}
 */
exports.isLonestarMsisdn = msisdn => {
	if (msisdn && typeof msisdn === "string") {
		const starting_digits = msisdn.substring(0, 5)
		return ["23188", "23155"].includes(starting_digits)
	}
}


