const redis = require("redis");
const redisSMQ = require("rsmq");
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

		console.log({ response });
		if (response === 1) {
			console.log("queue created");
		} else {
			console.log("unexpected error when creating queue");
		}
	} catch (error) {
		if (error.name === "queueExists") {
			console.log("Queue Exists");
		} else {
			console.log("error creating queue: ", error);
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
			console.log("Message sent. ID:", response);
		} else {
			console.log("unexpected error when sending messages to queue");
		}
	} catch (error) {
		console.log("error sending message to queue: ", error);
	}
};
