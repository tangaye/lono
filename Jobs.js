const logger = require("./logger")
const cron = require('node-cron')
const Orange = require("./services/Orange")
const Bulkgate = require("./services/Bulkgate")
const Mattermost = require("./services/Mattermost")

// Every day at 6:30 pm
const dailyCreditsReport = cron.schedule('30 18 * * *', async () => {

	try {

		console.log('---------------------');
  		console.log('Running Credits Balance Cron Job');

		const orange = new Orange()
		const bulkgate = new Bulkgate()
		const mattermost = new Mattermost()

		const orangeResult = await orange.getBalance() 
		const bulkgateResult = await bulkgate.getBalance() 

		const message = `#### Lono Daily Credits Summary [TEST]\n\n| Gateway | Available Credits | Expiry Date |\n|:------------------ |:------------------ |: --------------- |\n| Orange  | ${orangeResult.credits} |  ${orangeResult.expiryDate} |\n| BulkGate | ${bulkgateResult.credits} | not applicable |`

		console.log({orangeResult, bulkgateResult})

		await mattermost.sendMessage(message)


	} catch (error) {
		
		logger.error("error from check credits balance job: ", error)
	}
	
}, {scheduled: false})


// Runs every 10 minutes */10 * * * *
const bulkgateBalanceCheck = cron.schedule('*/30 * * * *', async () => {

	try {

		console.log('---------------------');
  		console.log('Running bulkgate credits balance cron job');

		const bulkgate = new Bulkgate()
		const mattermost = new Mattermost()
		const CREDITS_THRESHOLD = 200

		const result = await bulkgate.getBalance() 

		console.log({result})

		if (result.credits <= CREDITS_THRESHOLD)
		{
			const message = `#### 🚩🚩ALERT! ALERT! 🚩🚩\nBulkgate credits is running low, currently down to **${result.credits}**`
			await mattermost.sendMessage(message)
		} 


	} catch (error) {
		logger.error("error from check credits balance job: ", error)
	}
	
}, {scheduled: false})


/**
 * Starts all jobs
 * @return {Promise<void>}
 */
exports.startAll = () => {
	dailyCreditsReport.start()
	bulkgateBalanceCheck.start()
}
