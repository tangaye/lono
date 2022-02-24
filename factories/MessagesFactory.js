const database = require("../database/connection")
const Message = require("../models/Message")
const {Op, QueryTypes} = require("sequelize")
const Sender = require("../models/Sender")
const MessagePart = require("../models/MessagePart")
const constants = require("../constants")
const logger = require("../logger")
const helper = require("../helpers")

/**
 * Returns all messages in the last seven days for sender
 * @param {Array|Required} sender_ids
 * @returns {Promise<*[]|*>}
 */
exports.lastSevenDaysCount = async sender_ids => {
	try {

		 const messages = await database.query(`
				select date, cast(count(id) as int)
				from (select generate_series((current_date + 1) - interval '7 days', (current_date + 1) - interval '1 days', interval '1 days')::date as date) series
				left join messages
				on messages.created_at::date = date
				and messages.sender_id IN(:ids)
				group by date
				order by date desc`, {
			replacements: { ids: sender_ids },
			type: QueryTypes.SELECT
		});

		if (messages) return messages;
		return [];
	} catch (error) {
		console.log('error querying for lastSevenDaysCount: ', error);
		return [];
	}
}

/**
 * Returns the total number of messages sent
 * @param {Array|Required} sender_ids
 * @returns {Promise<number>}
 */
exports.total = async sender_ids => {
	try {

		return await Message.count({where: {sender_id: { [Op.in]: sender_ids }}})
	}
	catch (error) {
		console.log('error querying for total: ', error);
		return null;
	}
}

/**
 * Returns the total number of messages sent for sender on current date
 * @param {Array|Required} sender_ids
 * @returns {Promise<number|*>}
 */
exports.totalToday = async sender_ids => {
	try {
		return await database.query(`
				select cast(count(id) as int) 
				from messages 
				where created_at::date = CURRENT_DATE 
				and sender_id IN(:ids) `, {
			replacements: { ids: sender_ids },
			type: QueryTypes.SELECT
		})
	}
	catch (error) {
		console.log('error querying for totalToday: ', error);
		return 0;
	}
}

/**
 * Returns the latest 5 messages for a sender
 * @param {Array|Required} sender_ids
 * @returns {Promise<Message[]|*[]>}
 */
exports.latestFive = async sender_ids => {
	try {
		const messages = await database.query(`
			SELECT 
				   msg.id AS "smsId",
				   msg.message,
				   msg.credits AS cost,
				   msg.status,
				   json_build_object('id', s.id, 'name', s.name) AS sender,
				   json_build_object('id', g.id, 'name', g.name) AS gateway,
				   json_build_object('id', m.id) AS msisdn,
				   (
						SELECT json_agg(json_build_object('id', mp.id, 'status', mp.status, 'part', mp.part, 'credits', mp.credits, 'created_at', mp.created_at))
						FROM message_parts mp
						WHERE mp.message_id = msg.id
				   ) AS parts,
				   (
						SELECT json_build_object('id', u.id, 'name', u.name, 'created_at', u.created_at)
						FROM users u
						WHERE u.id = msg.user_id
				   ) AS user,
				   msg.created_at AS date
			FROM messages msg
				INNER JOIN msisdns m ON m.id = msg.msisdn_id
				INNER JOIN gateways g ON g.id = msg.gateway_id
				INNER JOIN senders s ON msg.sender_id = s.id
			WHERE msg.sender_id IN (:senders)
			ORDER BY msg.created_at DESC
			LIMIT 5
		`, {
			replacements: {senders: sender_ids},
			type: QueryTypes.SELECT
		})


		if (messages) return messages
		return []
	}
	catch (error)
	{
		console.log('error querying for latestFive: ', error);
		return [];
	}
}

/**
 * Stores a message in the database
 * @param {string|required} msisdn_id - recipient
 * @param {string|required} text - message's body
 * @param {string|required} sender_id - message's sender id
 * @param {string|required} gateway_id - sms gateway id
 * @param {string|null} ext_message_id - external message id from user
 * @param {string|required} user_id - external message id from user
 * @param {string|null} gateway_message_id - sms gateway message_id
 * @param {string|required} id - message id
 * @returns {Promise}
 */
exports.storeMessage = async (
	{
		msisdn_id,
		text,
		sender_id,
		gateway_id,
		ext_message_id= null,
		user_id,
		gateway_message_id= null,
		id
	}
) => {
	try {

		return await Message.create({
			id,
			msisdn_id,
			message: text,
			sender_id,
			gateway_id,
			user_id,
			gateway_message_id,
			ext_message_id,
			credits: constants.SMS_TARIFF
		})

	} catch (error) {

		logger.log("error creating message: ", error);

		return null;
	}
};

/**
 * messages id query
 * @return {string}
 */
const getIdQuery = search => search ? ` AND result.id = :message_id` : ` WHERE result.id = :message_id`

/**
 * messages search query
 * @return {string}
 */
const getSearchQuery = () => ` WHERE (
	result.user ->> 'name' ilike :search OR
	result.msisdn ->> 'id' ilike :search OR
	result.gateway ->> 'name' ilike :search OR
	result.sender ->> 'name' ilike :search OR
	result.parts::jsonb @? '$[*].status ? (@ like_regex "failed" flag "i")' OR
	result.message iLike :search OR
	result.status iLike :search
)`


exports.buildReplacements = (senders, message_id, search, limit, offset) => {

	const replacements = {senders, limit, offset, search: `%${search}%`}

	if (search && Number(search[0]) === 0) replacements.search = `%${search.substring(1)}%`

	if (message_id) replacements.message_id = message_id

	return replacements
}

/**
 * Setup query to query messages
 * @param search - search
 * @param message_id - message_id: for getting a messages
 * @param order - order or messages returned, asc or desc
 * @return {string}
 */
exports.buildQuery = (search, message_id, order) => {

	order = order ? order.toUpperCase() : 'DESC'

	let query = `
				SELECT *
				FROM (
					SELECT 
						   msg.id,
						   msg.message,
						   msg.credits,
						   msg.status,
						   json_build_object('id', s.id, 'name', s.name) AS sender,
						   json_build_object('id', g.id, 'name', g.name) AS gateway,
						   json_build_object('id', m.id) AS msisdn,
						   (
								SELECT json_agg(json_build_object('id', mp.id, 'status', mp.status, 'part', mp.part, 'credits', mp.credits, 'created_at', mp.created_at))
								FROM message_parts mp
								WHERE mp.message_id = msg.id
						   ) AS parts,
						   (
								SELECT json_build_object('id', u.id, 'name', u.name, 'created_at', u.created_at)
								FROM users u
								WHERE u.id = msg.user_id
						   ) AS user,
						   msg.created_at
					FROM messages msg
						INNER JOIN msisdns m ON m.id = msg.msisdn_id
						INNER JOIN gateways g ON g.id = msg.gateway_id
						INNER JOIN senders s ON msg.sender_id = s.id
					WHERE msg.sender_id IN (:senders)
				) result`

	if (search) query += getSearchQuery()
	if (message_id) query += getIdQuery(search)

	query += helper.getOrderQuery(order)
	query += helper.getLimitOffsetQuery()

	return query
}

/**
 * Returns pagination data
 * @param messages
 * @param totalItems
 * @param page
 * @param limit
 * @return {{totalItems, totalPages: number, messages, currentPage: number}}
 */
exports.getPagingData = (messages, totalItems, page, limit) => {

	const currentPage = page ? +page : 0;
	const totalPages = Math.ceil(totalItems / limit)

	return {totalItems, messages, totalPages, currentPage}
}


/**
 * @author @mrhumble
 * Breaks a message into parts
 * @param message
 * @param limit
 * @return {[]}
 */
exports.breakIntoParts = (message, limit) => {

	const queue = message.split(' ');
	const parts = [];

	while (queue.length) {

		const word = queue.shift();

		if (word.length >= limit)
		{
			parts.push(word)
		}
		else {

			let words = word;

			while (true) {

				if (!queue.length || words.length > limit || words.length + queue[0].length + 1 > limit) break

				words += ' ' + queue.shift();
			}

			parts.push(words)
		}
	}

	return parts

}