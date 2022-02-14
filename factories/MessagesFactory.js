const database = require("../database/connection")
const Message = require("../models/Message")
const {Op, QueryTypes} = require("sequelize")
const Sender = require("../models/Sender")
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
		let messages = await Message.findAll({
			attributes: constants.MESSAGES_ATTRIBUTES,
			include: {
				model: Sender,
				attributes: ["name"],
			},
			where: {sender_id: { [Op.in]: sender_ids }},
			order: [['created_at', 'desc']],
			limit: 5
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
	msisdn_id,
	text,
	sender_id,
	gateway_id,
	ext_message_id = null,
	user_id,
	gateway_message_id = null,
	id
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

const getIdQuery = () => ` AND id = :message_id`

const getSearchQuery = () => ` AND (
	u.name iLike :search OR
	m.id iLike :search OR
	s.name iLike :search OR
	msg.message iLike :search OR
	msg.status iLike :search
)`


exports.buildReplacements = (senders, message_id, search, limit, offset) => {

	const replacements = {senders, limit, offset, search: `%${search}%`}

	if (search && Number(search[0]) === 0) replacements.search = `%${search.substring(1)}%`

	if (message_id) replacements.message_id = message_id

	return replacements
}

exports.buildQuery = (search, message_id, order) => {

	order = order ? order.toUpperCase() : 'DESC'

	let query = `
				SELECT 
					   msg.id,
					   msg.message,
					   msg.credits,
					   msg.status,
					   json_build_object('id', u.id, 'name', u.name) as user,
					   json_build_object('id', s.id, 'name', s.name) as sender,
					   json_build_object('id', g.id, 'name', g.name) as gateway,
					   json_build_object('id', m.id) as msisdn,
					   msg.created_at
				FROM messages msg
					INNER JOIN msisdns m on m.id = msg.msisdn_id
					INNER JOIN gateways g on g.id = msg.gateway_id
					INNER JOIN users u on msg.user_id = u.id
					INNER JOIN senders s on msg.sender_id = s.id
				WHERE msg.sender_id IN (:senders)`

	if (search) query += getSearchQuery()
	if (message_id) query += getIdQuery()

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