const JobQueries = require("./factories/JobsFactory")
const constants = require("./constants")
const logger = require("./logger")
const helper = require("./helpers")
const Queue = require("./Queue")
const cron = require('node-cron')

// Run job every 5 seconds: */5 * * * * *
const failedMessages = cron.schedule('*/10 * * * * *', async () =>  {

	try {

		const payload = await JobQueries.failedMessageToRetry()

		if (payload) {

			console.log('data from failedMessages job: ', payload)
			// add to queue
			await Queue.add(payload, helper.getGatewayQueue(payload?.gateway?.slug) + '_retry')
		}
		else {

			console.log("LOG failedMessages job: ", "Payload is null. No data to queue")
		}

	}
	catch (error)
	{
		logger.error("error from job: ", error)
	}

}, {
	scheduled: false
})


// Run job every 5 seconds: */5 * * * * *
const pendingMessages = cron.schedule('*/10 * * * * *', async () =>  {

	try {

		const payload = await JobQueries.messageNotAddedToQueue()

		if (payload) {

			console.log('data from pendingMessages job: ', payload)

			// add to queue
			await Queue.add(payload, helper.getGatewayQueue(payload?.gateway?.slug))
		}
		else {

			console.log("LOG pendingMessages job: ", "Payload is null. No data to queue")
			console.log("[]:", "......................................................")
		}

	}
	catch (error)
	{
		logger.error("error from job: ", error)
	}

}, {
	scheduled: false
})

/**
 * Starts all jobs
 * @return {Promise<void>}
 */
exports.startAll = async () => {
	await failedMessages.start();
	await pendingMessages.start();
}
