const Msisdn = require("../models/Msisdn")
const ContactMsisdnUser = require("../models/ContactMsisdnUser")
const Contact = require("../models/Contact")
const Group = require("../models/Group")
const ContactGroup = require("../models/ContactGroup")
const database = require("../database/connection")
const logger = require("../logger")
const {Op} = require("sequelize");
const helpers = require("../helpers");


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
exports.createContact = async (first_name, middle_name, last_name, metadata, msisdns, groups, user) => {

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
					if (msisdn_created && !created_contact) {
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

const getSearchQuery = search => ` WHERE (
		groups::jsonb @? '$[*].name ? (@ like_regex ${JSON.stringify(search)} flag "i")' OR
      	msisdns::jsonb @? '$[*].id ? (@ like_regex ${JSON.stringify(search)} flag "i")' OR
      	users::jsonb @? '$[*].name ? (@ like_regex ${JSON.stringify(search)} flag "i")' OR
      	first_name ilike '%${search}%' OR
      	middle_name ilike '%${search}%' OR
      	last_name ilike '%${search}%' )`

const getIdQuery = search => search ? ` AND id = :contact_id` : ` WHERE id = :contact_id`


exports.buildReplacements = (user_id, contact_id, limit, offset) => {

	const replacements = {user_id, limit, offset}

	if (contact_id) replacements.contact_id = contact_id

	return replacements
}

exports.queryContacts = (search, contact_id, order) => {

	order = order ? order.toUpperCase() : 'DESC'

	if (search && Number(search[0]) === 0) search = search.substring(1)

	let query = `
				SELECT *
				FROM (
					 SELECT
						   c.id,
						   c.first_name,
						   c.middle_name,
						   c.last_name,
						   c.created_at,
						   (
								SELECT json_agg(json_build_object('id', m.id))
								FROM msisdns m
								LEFT JOIN contact_msisdns_users cmu ON m.id = cmu.msisdn_id
								WHERE cmu.contact_id = c.id AND cmu.user_id = :user_id
				
						   ) AS msisdns,
							(
								SELECT json_agg(json_build_object('id', u.id, 'name', u.name))
								FROM users u
								LEFT JOIN contact_msisdns_users cmu ON u.id = cmu.user_id
								WHERE cmu.contact_id = c.id AND u.id = :user_id
						   ) AS users,
						   (
								SELECT json_agg(json_build_object('id', g.id, 'name', g.name))
								FROM contact_groups
								LEFT JOIN groups g ON g.id = contact_groups.group_id
								WHERE contact_groups.contact_id = c.id AND
								g.user_id = :user_id
						   ) AS groups
					FROM contacts c
					GROUP BY c.id, c.created_at
				) contacts`

	if (search) query += getSearchQuery(search)
	if (contact_id) query += getIdQuery()

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