const UserController = require("../controllers/UsersController")
const JobQueries = require("../services/JobsQueries")
const constants = require("../constants")
const logger = require("../logger")
const Queue = require("../Queue")
const cron = require('node-cron')
const helper = require("../helpers");
const Sender = require("../models/Sender");
const User = require("../models/User");
const Gateway = require("../models/Gateway");

// Run job every 5 seconds: */5 * * * * *
const job = cron.schedule('*/5 * * * * *', async () =>  {

	try {

		const messages = await JobQueries.failedMessagesToRetry()

		console.log('DATA FROM JOB: ', messages)

		for (const message of messages)
		{
			// get data
			const sender = await Sender.findByPk(message.sender_id);
			const user = await User.findByPk(message.user_id);
			const gateway = await Gateway.findByPk(message.gateway_id);

			// prepare payload
			const payload = {
				message_id: message.id,
				to: message.msisdn_id,
				body: message.message,
				user,
				sender: sender.name
			}

			// add to queue
			await Queue.add(payload, constants.BULKGATE_MESSAGES_RETRY_QUEUE)
		}
	}
	catch (error)
	{
		logger.error("error from job: ", error)
	}

}, {
	scheduled: false
})

module.exports = job