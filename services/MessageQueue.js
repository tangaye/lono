const redis = require("redis");
const redisSMQ = require("rsmq");
const logger = require("../logger")
let redisConfig = {
	host: process.env.REDIS_HOST,
	port: process.env.REDIS_PORT,
};

if (process.env.NODE_ENV === "production") {
	redisConfig = {
		url: process.env.REDIS_URL,
	};
}
const redisClient = redis.createClient(redisConfig);
exports.queueInstance = new redisSMQ({ client: redisClient });
const { QUEUE } = require("../constants");

/**
 * Creates a queue
 * @returns {void}
 */
exports.createQueue = async () => {
	try {
		let response = await this.queueInstance.createQueueAsync({ qname: QUEUE });

		if (response === 1) {
			logger.log("queue created");
		} else {
			logger.log("unexpected error when creating queue");
		}
	} catch (error) {
		if (error.name === "queueExists") {
			logger.log("Queue Exists");
		} else {
			logger.log("error creating queue: ", error);
		}
	}
};

/**
 * Adds messages to the queue
 * @param {Object} data - {queue, message, gateway}
 * @returns {void}
 */
exports.add = async (data) => {
	try {
		let response = await this.queueInstance.sendMessageAsync({
			qname: QUEUE,
			message: JSON.stringify(data),
		});

		if (response) {
			logger.log("Message sent. ID:", response);
		} else {
			logger.log("unexpected error when sending messages to queue");
		}
	} catch (error) {
		logger.log("error sending message to queue: ", error);
	}
};

redisClient
	.on("connect", function () {
		logger.log("connected to redis");
	})
	.on("error", function (error) {
		logger.log("unable to connect to redis");
		// console.error(error);
	});
