const database = require("../database/connection");
const Message = require("../models/Message");
const { Op, QueryTypes } = require("sequelize");
const constants = require("../constants");
const logger = require("../logger");
const helper = require("../helpers");
const Gateway = require("../models/Gateway");
const Carrier = require("../models/Carrier");

/**
 * Returns all messages in the last seven days for user
 * @param {String|Required} user_id
 * @returns {Promise<*[]|*>}
 */
exports.lastSevenDaysCount = async (user_id) => {
	try {
		const messages = await database.query(
			`
				select date, cast(count(id) as int)
				from (select generate_series((current_date + 1) - interval '7 days', (current_date + 1) - interval '1 days', interval '1 days')::date as date) series
				left join messages
				on messages.created_at::date = date
				and messages.user_id = :user_id
				group by date
				order by date desc`,
			{
				replacements: { user_id: user_id },
				type: QueryTypes.SELECT,
			}
		);

		if (messages) return messages;
		return [];
	} catch (error) {
		console.log("error querying for lastSevenDaysCount: ", error);
		return [];
	}
};

/**
 * Returns the total number of messages sent
 * @param {String|Required} user_id
 * @returns {Promise<number>}
 */
exports.total = async (user_id) => {
	try {
		return await Message.count({
			where: { user_id: user_id },
		});
	} catch (error) {
		console.log("error querying for total: ", error);
		return null;
	}
};

/**
 * Returns the total number of messages sent for sender on current date
 * @param {String|Required} user_id
 * @returns {Promise<number|*>}
 */
exports.totalToday = async (user_id) => {
	try {
		return await database.query(
			`
				select cast(count(id) as int)
				from messages
				where created_at::date = CURRENT_DATE
				and messages.user_id = :user_id `,
			{
				replacements: { user_id: user_id },
				type: QueryTypes.SELECT,
			}
		);
	} catch (error) {
		console.log("error querying for totalToday: ", error);
		return 0;
	}
};

/**
 * Returns the latest 5 messages for a sender
 * @param {String|Required} user_id
 * @returns {Promise<Message[]|*[]>}
 */
exports.latestFive = async (user_id) => {
	try {
		const messages = await database.query(
			`
            SELECT
                msg.id,
                msg.message,
                msg.credits,
                msg.status,
                senders.name as sender,
                msisdns.number as msisdn,
                CASE WHEN COUNT(mp.id) = 0 THEN NULL ELSE json_agg(json_build_object('part', mp.part, 'status', mp.status)) END AS parts,
                msg.created_at
            FROM messages msg
                LEFT JOIN message_parts mp on msg.id = mp.message_id
                INNER JOIN msisdns on msisdns.id = msg.msisdn_id
                inner join senders on senders.id = msg.sender_id
            WHERE msg.user_id = :user_id
			GROUP BY msg.id, senders.name, msisdns.number
			ORDER BY msg.created_at DESC
			LIMIT 5
		`,
			{
				replacements: { user_id: user_id },
				type: QueryTypes.SELECT,
			}
		);

		if (messages) return messages;
		return [];
	} catch (error) {
		console.log("error querying for latestFive: ", error);
		return [];
	}
};

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
exports.storeMessage = async ({
	msisdn_id,
	text,
	sender_id,
	gateway_id,
	ext_message_id = null,
	user_id,
	gateway_message_id = null,
	id,
}) => {
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
			credits: constants.SMS_TARIFF,
		});
	} catch (error) {
		logger.log("error creating message: ", error);

		return null;
	}
};

/**
 * messages id query
 * @return {string}
 */
const getIdQuery = () => ` AND msg.id = :message_id`;

const getGroupByQuery = () => ` GROUP BY msg.id, senders.name, msisdns.number`;

/**
 * messages search query
 * @return {string}
 */

const getSearchQuery = () => ` AND (
    msisdns.number like :search OR
	msg.message like :search OR
	msg.status like :search OR
    mp.status like :search
)`;

exports.buildReplacements = (user_id, message_id, search, limit, offset) => {
	const replacements = { user_id, limit, offset, search: `%${search}%` };

	if (search && Number(search[0]) === 0)
		replacements.search = `%${search.substring(1)}%`;

	if (message_id) replacements.message_id = message_id;

	return replacements;
};

exports.buildExportReplacements = (user_id, msisdns, start_date, end_date) => {

	const replacements = { user_id, msisdns, start_date, end_date};

	return replacements;
};


/**
 * Setup query to query messages
 * @param search - search
 * @param message_id - message_id: for getting a messages
 * @param order - order or messages returned, asc or desc
 * @return {string}
 */
exports.buildQuery = (user_id, search, message_id, order) => {
	order = order ? order.toUpperCase() : "DESC";

	let query = `
        SELECT
            msg.id,
            msg.message,
            msg.credits,
            msg.status,
            senders.name as sender,
            msisdns.number as msisdn,
            CASE WHEN COUNT(mp.id) = 0 THEN NULL ELSE json_agg(json_build_object('part', mp.part, 'status', mp.status)) END AS parts,
            msg.created_at
        FROM messages msg
            LEFT JOIN message_parts mp on msg.id = mp.message_id
            INNER JOIN msisdns on msisdns.id = msg.msisdn_id
            inner join senders on senders.id = msg.sender_id`;

	if (search) query += getSearchQuery();
	if (message_id) query += getIdQuery(search);

	query += getGroupByQuery();
	query += helper.getOrderQuery(order);
	query += helper.getLimitOffsetQuery();

	return query;
};

/**
 * Setup query to export messages
 * @param search - search
 * @param message_id - message_id: for getting a messages
 * @param order - order or messages returned, asc or desc
 * @return {string}
 */
exports.buildExportQuery = () => {

	const query = `
        SELECT
            msg.id,
            msg.message,
            msg.credits,
            msg.status,
            (SELECT s.name FROM senders s WHERE s.id = msg.sender_id) AS sender,
            msisdns.number,
            msg.created_at
        FROM messages msg
            inner join msisdns on msisdns.id = msg.msisdn_id
        WHERE msg.user_id = :user_id
        AND (
            (msg.created_at::date BETWEEN :start_date AND :end_date)
            OR (msg.created_at::date >= :start_date AND :end_date IS NULL)
            OR (msg.created_at::date <= :end_date AND :start_date IS NULL)
            OR (:start_date IS NULL AND :end_date IS NULL)
        )
        AND ((:msisdns) IS NULL OR msisdns.number IN (:msisdns))
        GROUP BY msg.id, msisdns.number
        ORDER BY created_at ASC`;

	return query;
};

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
	const totalPages = Math.ceil(totalItems / limit);

	return { totalItems, messages, totalPages, currentPage };
};

/**
 * @author @mrhumble
 * Breaks a message into parts
 * @param message
 * @param limit
 * @return {[]}
 */
exports.breakIntoParts = (message, limit) => {
	const queue = message.split(" ");
	const parts = [];

	while (queue.length) {
		const word = queue.shift();

		if (word.length >= limit) {
			parts.push(word);
		} else {
			let words = word;

			while (true) {
				if (
					!queue.length ||
					words.length > limit ||
					words.length + queue[0].length + 1 > limit
				)
					break;

				words += " " + queue.shift();
			}

			parts.push(words);
		}
	}

	return parts;
};

exports.getGateway = async msisdn => {

    try {

        const starting_digits = msisdn.substring(0, 5)

        const gateway = await Gateway.findOne({
            attributes: ['id', 'name', 'queue'],
            include: {
                model: Carrier,
                attributes: ['id', 'name', 'msisdn_prefix'],
                where: {
                    msisdn_prefix: {
                        [Op.contains]: [starting_digits]
                    }
                },
                through: {attributes: []}
            }
        })

        return gateway

    } catch (error) {
        logger.error("Error gateway for message", error)
    }
}
