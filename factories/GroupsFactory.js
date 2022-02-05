const logger = require("../logger")
const helper = require("../helpers")
const Group = require("../models/Group")
const {Op} = require("sequelize");

/**
 * Returns true if groups array is valid
 * @param {array|required} groups - groups ids
 * @return {Promise<null|boolean>}
 */
exports.groupsValid = async groups => {

	try {

		if (groups?.length > 0) {
			// check if values are valid uuids
			const valid_uuids = groups.every(id => helper.isValidUuid(id))
			if (!valid_uuids) return false

			for (const id in groups)
			{
				const group = await Group.findByPk(id)
				if (!group) return false
			}
		}

		return true
	}
	catch (error)
	{
		logger.error("error groupsValid: ", error)
		return null
	}
}

/**
 * Prepares and returns where clause for groups query
 * @param {string|required} user_id - message senders
 * @param {string|null} search
 * @param {string|null} id - message id
 * @return {object}
 */
exports.getWhereClause = (user_id, search, id) => {

	const where_clause = {user_id}
	if (search) {

		where_clause[Op.or] = [

			{name: { [Op.iLike]: `%${search}%` }},
			{description: { [Op.iLike]: `%${search}%`}}
		]
	}

	if (id) where_clause.id = id

	return where_clause

}

/**
 * Returns pagination data
 * @param data
 * @param page
 * @param limit
 * @return {{totalItems, totalPages: number, messages, currentPage: number}}
 */
exports.getPagingData = (data, page, limit) => {
	const { count: totalItems, rows: groups } = data;
	const currentPage = page ? +page : 0;
	const totalPages = Math.ceil(totalItems / limit);

	return { totalItems, groups, totalPages, currentPage };
}