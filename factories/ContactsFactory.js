const Msisdn = require("../models/Msisdn")
const ContactMsisdnUser = require("../models/ContactMsisdnUser")
const Contact = require("../models/Contact")
const Group = require("../models/Group")
const ContactGroup = require("../models/ContactGroup")
const database = require("../database/connection")
const logger = require("../logger")
const {Op} = require("sequelize");


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
				// else
				// {
				//
				// 	// find or create msisdn
				// 	const [found_msisdn, msisdn_created] = await Msisdn.findOrCreate({
				// 		where: {id},
				// 		defaults: {id},
				// 		transaction: t
				// 	})
				//
				// 	msisdn = found_msisdn
				//
				// 	// create contact
				// 	contact = await Contact.create({
				// 		first_name, middle_name, last_name, metadata
				// 	}, { transaction: t })
				//
				// 	// assign newly created contact to user and msisdn
				// 	await ContactMsisdnUser.findOrCreate({
				// 		where: {msisdn_id: msisdn.id, contact_id: contact.id, user_id: user.id},
				// 		defaults: {msisdn_id: msisdn.id, contact_id: contact.id, user_id: user.id},
				// 		transaction: t
				// 	})
				// }



				// find or create msisdn
				// const [msisdn, msisdn_created] = await Msisdn.findOrCreate({
				// 	where: {id},
				// 	defaults: {id},
				// 	transaction: t
				// })
				//
				// console.log({msisdn_created})
				//
				// if (msisdn_created)
				// {
				// 	// create contact for msisdn if contact is null
				// 	if (!contact) contact = await Contact.create({
				// 		first_name, middle_name, last_name, metadata
				// 	}, { transaction: t })
				// }
				// else
				// {
				// 	// check if msisdn has been assigned to user
				// 	const msisdn_assigned = await ContactMsisdnUser.findOne({
				// 		where: {msisdn_id: msisdn.id, user_id: user.id}
				// 	})
				//
				// 	// if msisdn has been assigned, set contact to the contact the msisdn
				// 	// has been assigned to
				// 	if (msisdn_assigned && !contact) contact = await Contact.findByPk(msisdn_assigned.contact_id)
				// }

				// assign msisdn to contact and user
				// if (contact && msisdn) await ContactMsisdnUser.findOrCreate({
				// 	where: {msisdn_id: msisdn.id, contact_id: contact.id, user_id: user.id},
				// 	defaults: {msisdn_id: msisdn.id, contact_id: contact.id, user_id: user.id},
				// 	transaction: t
				// })
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
 * Prepares and returns where clause for contacts query
 * @param {string|required} user_id - user id
 * @param {string|null} search
 * @param {string|null} id - contact id
 * @return {object}
 */
exports.getWhereClause = (user_id, search, id) => {

	const where_clause = {'$users.id$': user_id}

	if (search) {

		if (Number(search[0]) === 0) search = search.substring(1)

		where_clause[Op.or] = [

			{first_name: { [Op.iLike]: `%${search}%` }},
			{middle_name: { [Op.iLike]: `%${search}%`}},
			{last_name: { [Op.iLike]: `%${search}%`}},
			{'$msisdns.id$': { [Op.iLike]: `%${search}%`}},
			{'$groups.name$': { [Op.iLike]: `%${search}%`}}
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
	const { count: totalItems, rows: contacts } = data;
	const currentPage = page ? +page : 0;
	const totalPages = Math.ceil(totalItems / limit);

	return { totalItems, contacts, totalPages, currentPage };
}