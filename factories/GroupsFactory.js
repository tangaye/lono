const logger = require("../logger")
const helper = require("../helpers")
const Group = require("../models/Group")

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

const getSearchQuery = () => ` AND g.name iLike :search`
const getGroupByQuery = () => ` GROUP BY g.id, g.name, g.created_at`


exports.buildReplacements = (user_id, search, limit, offset) => {

	const replacements = {user_id, limit, offset, search: `%${search}%`}

	if (search && Number(search[0]) === 0) replacements.search = `%${search.substring(1)}%`

	return replacements
}

exports.queryGroups = (search, order) => {

	order = order ? order.toUpperCase() : 'DESC'

	let query = `
				SELECT g.id,
					   g.name,
					   g.description,
					   g.created_at,
					   count(contact_id) AS contacts
				FROM groups g
				INNER JOIN contact_groups cg on g.id = cg.group_id
				WHERE g.user_id = :user_id`

	if (search) query += getSearchQuery()

	query += getGroupByQuery()
	query += helper.getOrderQuery(order)
	query += helper.getLimitOffsetQuery()

	return query
}

/**
 * Returns pagination data
 * @param groups
 * @param totalItems
 * @param page
 * @param limit
 * @return {{totalItems, totalPages: number, messages, currentPage: number}}
 */
exports.getPagingData = (groups, totalItems, page, limit) => {

	const currentPage = page ? +page : 0;
	const totalPages = Math.ceil(totalItems / limit);

	return {totalItems, groups, totalPages, currentPage };
}