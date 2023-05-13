const logger = require("./logger")
const cron = require('node-cron')
const Orange = require("./services/Orange")
const DSeven = require("./services/Dseven")
const Bulkgate = require("./services/Bulkgate")
const Mattermost = require("./services/Mattermost")


// Every day at 6:30 pm
const dailyCreditsReport = cron.schedule('30 18 * * *', async () => {

	try {

		console.log('---------------------');
  		console.log('Running daily credits usage');

		const orange = new Orange()
		const bulkgate = new Bulkgate()
        const dseven = new DSeven()
		const mattermost = new Mattermost()

		const orangeResult = await orange.getBalance()
        const dsevenResult = await dseven.getBalance()
		const bulkgateResult = await bulkgate.getBalance()

		const message = `#### Lono Daily Credits Summary\n\n| Gateway | Credits | Expiry Date |\n|:------------------ |:------------------ |: --------------- |\n| Orange  | ${orangeResult?.credits} |  ${orangeResult?.expiryDate} |\n| BulkGate | ${bulkgateResult?.credits} | not applicable |\n| DSeven | ${dsevenResult?.credits} | not applicable |`

		await mattermost.sendMessage(message)


	} catch (error) {

		logger.error("error from daily credits check: ", error)
	}

}, {scheduled: false})


// Run every 30 mins b/w 6:30 am - 10 pm
const balanceCheck = cron.schedule('30/30 6-21,22 * * *', async () => {

	try {

		console.log('---------------------');
  		console.log('Running credits balance alerts cron job');

        const dseven = new DSeven()
        const bulkgate = new Bulkgate()
		const mattermost = new Mattermost()

		const bulkgateResult = await bulkgate.getBalance()
        const dsevenResult = await dseven.getBalance()

		if (bulkgateResult.credits <= 200)
		{
			const message = `#### 🚩🚩ALERT! ALERT! 🚩🚩\nBulkgate credits is running low, currently down to **${bulkgateResult.credits}**`
			await mattermost.sendMessage(message)
		}

        if (dsevenResult.credits <= 20)
		{
			const message = `#### 🚩🚩ALERT! ALERT! 🚩🚩\n**DSeven** credits is running low, currently down to **${dsevenResult.credits}**`
			await mattermost.sendMessage(message)
		}


	} catch (er) {
		logger.error("error from check credits balance job: ", er)
	}

}, {scheduled: false})





/**
 * Starts all jobs
 * @return {Promise<void>}
 */
exports.startAll = () => {
	dailyCreditsReport.start()
	balanceCheck.start()
}
