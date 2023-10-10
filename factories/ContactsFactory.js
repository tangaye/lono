const Msisdn = require("../models/Msisdn")
const ContactMsisdnUser = require("../models/ContactMsisdnUser")
const Contact = require("../models/Contact")
const Group = require("../models/Group")
const ContactGroup = require("../models/ContactGroup")
const database = require("../database/connection")
const logger = require("../logger")
const helpers = require("../helpers")


/**
 * Creates a contact and assigns groups and msisdns
 *
 * @param {string|null} first_name - contact metadata
 * @param {string|null} middle_name - contact metadata
 * @param {string|null} last_name - contact metadata
 * @param {string|null} metadata - contact other metadata
 * @param {array<string>|required} msisdns - msisdns or phone numbers to assign to contact
 * @param {array<string>|null} groups - group to assign contact to if provided
 * @param {object|required} user - user to assign contact to
 * @return {Promise<null|*>}
 */
exports.createContact = async ({
	first_name = null,
	middle_name = null,
	last_name = null,
	metadata= null,
	msisdns,
	groups = null,
	user
}) => {

	try {

		const result = await database.transaction(async (t) => {

			let contact = null
			let created_contact = null

			// 1. loop through msisdns
			for (const id of msisdns)
			{

				let msisdn = null

				// check if msisdn has been assigned to user
				const msisdn_assigned = await ContactMsisdnUser.findOne({
					where: {msisdn_id: id, user_id: user.id}
				})

				// If msisdn has been assigned to user
				if (msisdn_assigned)
				{
					// set contact to the contact msisdn was assigned to when assigning to user
					contact = await Contact.findByPk(msisdn_assigned.contact_id)

					// set msisdn to msisdn
					msisdn = await Msisdn.findByPk(msisdn_assigned.msisdn_id)
				}
				else
				{

					const [found_msisdn, msisdn_created] = await Msisdn.findOrCreate({
						where: {id},
						defaults: {id},
						transaction: t
					})

					msisdn = found_msisdn

					// create contact
					if (!created_contact) {

						contact = await Contact.create({first_name, middle_name, last_name, metadata}, { transaction: t })
						created_contact = contact
					}

					if (contact && msisdn) await ContactMsisdnUser.findOrCreate({
						where: {msisdn_id: msisdn.id, contact_id: contact.id, user_id: user.id},
						defaults: {msisdn_id: msisdn.id, contact_id: contact.id, user_id: user.id},
						transaction: t
					})
				}

			}

			// assign contact to groups
			if (groups && groups.length > 0) {

				const group_contact = created_contact ? created_contact : contact

				for (const name of groups) {

					// find or create groups
					const [group, created] = await Group.findOrCreate({
						where: {name, user_id: user.id},
						defaults: {name, user_id: user.id},
						transaction: t
					})

					// assign contact to groups
					if (group) await ContactGroup.findOrCreate({
						where: {contact_id: group_contact.id, group_id: group.id},
						defaults: {contact_id: group_contact.id, group_id: group.id},
						transaction: t
					})
				}
			}

			return created_contact ? created_contact : contact

		})

		if (result) return Contact.findByPk(result.id,{
			attributes: ['id', 'first_name', 'middle_name', 'last_name', 'created_at'],
			include: [
				{
					model: Msisdn,
					attributes: ['id'],
					through: {attributes: []}
				},
				{
					model: Group,
					attributes: ['id', 'name'],
					through: {attributes: []}
				}
				]
		})

		return null

	}
	catch (error)
	{
		logger.log("error creating contact: ", error)

		return null
	}
}

/**
 * returns search query for contacts
 * @param search
 * @return {` AND (
		groups::jsonb @? '$[*].name ? (@ like_regex ${string} flag "i")' OR
      	msisdns::jsonb @? '$[*].id ? (@ like_regex ${string} flag "i")' OR
      	first_name ilike '%${string}%' OR
      	last_name ilike '%${string}%' )`}
 */
const getSearchQuery = search => ` WHERE (
		groups::jsonb @? '$[*].name ? (@ like_regex ${JSON.stringify(search)} flag "i")' OR
      	msisdns::jsonb @? '$[*].id ? (@ like_regex ${JSON.stringify(search)} flag "i")' OR
      	first_name ilike '%${search}%' OR
      	last_name ilike '%${search}%' )`

exports.buildReplacements = (user_id, limit, offset) => {

	const replacements = {user_id, limit, offset}

	return replacements
}

/**
 * setups query to fetch contacts
 * @param search search value
 * @param user_id contacts user id
 * @param order asc or desc
 * @return {string}
 */
exports.queryContacts = (search, user_id, order) => {

	order = order ? order.toUpperCase() : 'DESC'

	if (search && Number(search[0]) === 0) search = search.substring(1)

	let query = `
        SELECT * FROM
        (
            SELECT
                c.id,
                c.first_name,
                c.middle_name,
                c.last_name,
                c.created_at,
                c.user_id,
                (
                    SELECT array_agg(m.number)
                    FROM msisdns m
                    INNER JOIN contact_msisdns cm ON m.id = cm.msisdn_id
                    WHERE cm.contact_id = c.id
                ) AS msisdns,
                (
                    SELECT json_agg(json_build_object('id', g.id, 'name', g.name))
                    FROM contact_groups
                    INNER JOIN groups g ON g.id = contact_groups.group_id
                    WHERE contact_groups.contact_id = c.id
                ) AS groups
            FROM contacts c
            WHERE c.user_id = :user_id
        ) contacts`

	if (search) query += getSearchQuery(search)
	query += helpers.getOrderQuery(order)
	query += helpers.getLimitOffsetQuery()

	return query
}

/**
 * Returns pagination data
 * @param contacts
 * @param totalItems
 * @param page
 * @param limit
 * @return {{totalItems, totalPages: number, messages, currentPage: number}}
 */
exports.getPagingData = (contacts, totalItems, page, limit) => {

	const currentPage = page ? +page : 0;
	const totalPages = Math.ceil(totalItems / limit);

	return {totalItems, contacts, totalPages, currentPage };
}

exports.getContactQuery = () => {
    return ` SELECT
            c.id,
            c.first_name,
            c.middle_name,
            c.last_name,
            c.created_at,
            (
                SELECT array_agg(m.number)
                FROM msisdns m
                INNER JOIN contact_msisdns cm ON m.id = cm.msisdn_id
                WHERE cm.contact_id = c.id
            ) AS msisdns,
            (
                SELECT json_agg(json_build_object('id', g.id, 'name', g.name))
                FROM contact_groups
                INNER JOIN groups g ON g.id = contact_groups.group_id
                WHERE contact_groups.contact_id = c.id
            ) AS groups
        FROM contacts c
        WHERE c.user_id = :user_id and c.id = :id`
}