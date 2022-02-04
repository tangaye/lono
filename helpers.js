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
 * Checks if a sender name for SMS is a valid one.
 * Should be of length 11
 * Should contain chars a-z/A-Z
 * @param {String} name
 * @returns {Boolean}
 */
exports.isValidSenderName = name => {
	let alpha = /^[a-z]+$/i.test(name)
	let valid_length = name.length > 1 && name.length <= 11

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

exports.generateApiKey = () => generateApiKey({
	method: 'string',
	pool: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.@#$*',
	min: 32,
	max: 64
})

exports.getGatewayQueue = gateway_slug => {

	if (gateway_slug === 'twilio') return constants.TWILIO_MESSAGES_QUEUE
	if (gateway_slug === 'bulkgate') return constants.BULKGATE_MESSAGES_QUEUE

}
