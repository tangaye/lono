const redis = require("redis");
const redisSMQ = require("rsmq");
const logger = require("./logger")

const redisClient = redis.createClient({
	url: process.env.REDIS_URL,
	retry_strategy: function (options) {
		if (options.error && options.error.code === "ECONNREFUSED") {
			// End reconnecting on a specific error and flush all commands with
			// a individual error
			return new Error("The server refused the connection");
		}
		if (options.total_retry_time > 1000 * 60 * 60) {
			// End reconnecting after a specific timeout and flush all commands
			// with an individual error
			return new Error("Retry time exhausted");
		}
		if (options.attempt > 10) {
			// End reconnecting with built in error
			return undefined;
		}
		// reconnect after
		return Math.min(options.attempt * 100, 3000);
	}
});
exports.queueInstance = new redisSMQ({ client: redisClient });

/**
 * Creates a queue
 * @returns {void}
 */
exports.createQueue = async (queue) => {
	try {

		const response = await this.queueInstance.createQueueAsync({ qname: queue });

		if (response === 1) {
			logger.log("queue created");
		} else {
			logger.log("unexpected error when creating queue");
		}

		return response

	} catch (error) {
		if (error.name === "queueExists") {
			logger.log(`Queue Exists: ${queue}`);
		} else {
			logger.log("error creating queue: ", error);
		}
		return 0
	}
};

/**
 * Adds messages to the queue
 * @param data - data to add to queue
 * @param queue - name of queue
 * @returns {void}
 */
exports.add = async (data, queue) => {
	try {

		const response = await this.queueInstance.sendMessageAsync({
			qname: queue,
			message: JSON.stringify(data),
		});

		if (response) {
			logger.log("Message sent. ID:", response);
		} else {
			logger.log("unexpected error when sending messages to queue");
		}
		return response

	} catch (error) {
		logger.log("error sending message to queue: ", error);
	}
};

/**
 * Removes data from the queue
 * @param {String} qname - name of queue to remove data from
 * @param {String} id - resource id to remove from queue
 */
exports.removeFromQueue = async (qname, id) => {

	try {

		const response = await this.queueInstance.deleteMessageAsync({qname, id});

		if (response === 1) {
			logger.log("Message deleted.");
		} else {
			logger.log("Message not found");
		}

		return response
	} catch (error) {
		logger.log("error removing message from queue: ", error);
	}

}

redisClient
	.on("connect", function () {
		logger.log("connected to redis");
	})
	.on("error", function (error) {
		logger.error("unable to connect to redis");
		// console.error(error);
	});
