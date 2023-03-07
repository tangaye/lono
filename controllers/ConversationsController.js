const logger = require("../logger");
const helper = require("../helpers");
const constants = require("../constants");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const MessageFactory = require("../factories/MessagesFactory");

exports.all = async (request, response) => {
	try {
		const conversations = await Conversation.findAll({
			attributes: [
				"id",
				"from",
				"to",
				"message",
				"status",
				"credits",
				"user_id",
				"created_at",
			],
			limit: 100,
			order: [["created_at", "desc"]],
		});

		if (conversations)
			return helper.respond(response, {
				code: constants.SUCCESS_CODE,
				conversations,
			});

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: "error fetching conversations",
		});
	} catch (error) {
		logger.log("error fetching conversations", error);

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: error?.errors ? error?.errors[0]?.message : message,
		});
	}
};

exports.create = async (request, response) => {
	try {
		const { to, message, user } = request.body;

		const conversation = await createConversation({
			from: process.env.CONVERSATION_BUSINESS_NUMBER,
			to: to,
			message,
			direction: "outgoing",
			user_id: user.id,
		});

		if (conversation)
			return helper.respond(response, {
				code: constants.SUCCESS_CODE,
				conversation: {
					id: conversation.id,
					to: conversation.to,
					message: conversation.message,
					user_id: conversation.user_id,
					status: conversation.status,
					created_at: conversation.created_at,
					credits: conversation.credits,
					direction: conversation.direction,
				},
			});

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: "error creation conversation",
		});
	} catch (error) {
		logger.log("error creating conversation", error);

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: error?.errors ? error?.errors[0]?.message : message,
		});
	}
};

exports.handleIncoming = async (request, response) => {
	try {
		console.log("========= HANDLE INCOMING===========");
		console.log("Request query: ", request.query);
		console.log("Request body: ", request.body);

		const { task } = request.query;

		// 1. Check if tasks
		if (task === "sent") {
			// 1.a find all messages that are queued and send their ids
			const ids = request.body?.queued_messages;

			if (ids) {
				const conversations = await Conversation.findAll({
					attributes: ["id", "status"],
					where: { id: ids },
				});

				if (conversations) {
					// extract uuids
					const uuids = conversations.map(
						(conversation) => conversation.id
					);

					// update conversations so they are not sent again
					for (const conversation of conversations) {
						await conversation.update({ status: "delivered" });
					}

					return response.json({
						message_uuids: uuids,
					});
				}
			}
		}

		const { from, message, secret } = request.body;

		if ((from, message, secret)) {
			const user = await User.findOne({ where: { api_key: secret } });
			await createConversation({
				from: from.substring(1),
				to: process.env.CONVERSATION_BUSINESS_NUMBER,
				message,
				status: "delivered", // incoming messages are delivered by default
				direction: "incoming",
				user_id: user.id,
			});
		}

		return response.json({
			payload: {
				success: true,
				task: "send",
				error: null,
			},
		});
	} catch (error) {
		console.log({ error });
		logger.error("Error handling incoming messages", error);

		return response.json({
			payload: {
				success: false,
				error: "error from server",
			},
		});
	}
};

exports.handleOutgoing = async (request, response) => {
	try {
		console.log("========= HANDLE Outgoing ===========");
		console.log("Request query: ", request.query);

		const { task } = request.query;

		//1. Check if task is 'send'
		if (task === "send") {
			// 1.a find messages  with status 'queued' and return them
			const conversations = await Conversation.findAll({
				attributes: ["id", "from", "message", "status"],
				where: { status: "queued" },
				order: [["created_at", "desc"]],
			});

			console.log({ conversations });

			if (conversations.length > 0) {
				const messages = conversations.map((conversation) => {
					return {
						to: `+${conversation.from}`,
						message: conversation.message,
						uuid: conversation.id,
					};
				});

				return response.json({
					payload: {
						task: "send",
						secret: process.env.CONVERSATION_SECRET,
						messages: messages,
					},
				});
			}
		}

		return response.json(200);
	} catch (error) {
		logger.log("error handling outgoing conversations", error);
		return response.status(400).json({ message: "bad request" });
	}
};

const createConversation = async ({
	from,
	to,
	message,
	direction,
	user_id,
}) => {
	try {
		const parts = MessageFactory.breakIntoParts(message, 140);
		const credits = constants.SMS_TARIFF * parts.length;

		const conversation = await Conversation.create({
			from,
			to,
			message,
			credits,
			direction,
			user_id,
		});

		if (conversation) return conversation;
	} catch (error) {
		logger.log("error creating conversation", error);
	}
};
