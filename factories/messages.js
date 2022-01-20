const database = require("../database/connection")
const Message = require("../models/Message")
const {Op, QueryTypes} = require("sequelize");
const Sender = require("../models/Sender");
const constants = require("../constants")

/**
 * Returns all messages in the last seven days for sender
 * @param {Array|Required} sender_ids
 * @returns {Promise<*[]|*>}
 */
exports.lastSevenDaysCount = async sender_ids => {
	try {

		let messages = await database.query(`
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
		return 0;
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

exports.getPagingData = (data, page, limit) => {
	const { count: totalItems, rows: messages } = data;
	const currentPage = page ? +page : 0;
	const totalPages = Math.ceil(totalItems / limit);

	return { totalItems, messages, totalPages, currentPage };
};

exports.getPagination = (page, size, order) => {
	const limit = size ? +size : 5;
	const offset = page ? page * limit : 0;
	const order_by = order ? order.toUpperCase()  : 'DESC';

	return { limit, offset, order_by };
};

exports.getSearch  = (search) => {
	const condition = search ? { 
		[Op.or]: [
			
				{message: { [Op.iLike]: `%${search}%` }},
				{recipient: { [Op.iLike]: `%${search}%`}},
				{status: { [Op.iLike]: `%${search}%`}},
			]
		}
		: null;
	return condition;
}