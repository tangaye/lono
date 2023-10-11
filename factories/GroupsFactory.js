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
					   count(contact_id)::integer AS contacts
				FROM groups g
				left join contact_groups cg on g.id = cg.group_id
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

exports.getGroupQuery = () => {
    return ` select
    id,
    name,
    (
        select json_agg(
            json_build_object(
                'id', c.id,
                'first_name', c.first_name,
                'middle_name', c.middle_name,
                'last_name', c.last_name,
                'msisdns', (
                    SELECT array_agg(m.number)
                    FROM msisdns m
                    inner join contact_msisdns cm on cm.msisdn_id = m.id
                    where cm.contact_id = c.id
                )
            ))
        from contacts c
        inner join contact_groups cg on c.id = cg.contact_id and g.id = cg.group_id
    ) as contacts
    from groups g
    where id = :id and g.user_id = :user_id`;
}