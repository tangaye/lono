const Msisdn = require("../models/Msisdn")
const ContactMsisdnUser = require("../models/ContactMsisdnUser")
const Contact = require("../models/Contact")
const Group = require("../models/Group")
const ContactGroup = require("../models/ContactGroup")
const database = require("../database/connection")
const logger = require("../logger")
const User = require("../models/User");


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

		return await database.transaction(async (t) => {

			let contact = null

			for (const id of msisdns)
			{
				// find or create msisdn
				const [msisdn, created] = await Msisdn.findOrCreate({
					where: {id},
					defaults: {id},
					transaction: t
				})

				// check if msisdn has been assigned to contact and user
				const msisdn_assigned = await ContactMsisdnUser.findOne({
					where: {msisdn_id: msisdn.id, user_id: user.id}
				})

				// if msisdn has been assigned, set contact to the contact the msisdn
				// has been assigned to
				if (msisdn_assigned)
				{
					contact = await Contact.findByPk(msisdn_assigned.contact_id)
				}
				else
				{
					// create contact
					contact = await Contact.create({
						first_name, middle_name, last_name, metadata
					}, { transaction: t })

					// assign contact to groups
					if (groups && groups.length > 0) {
						for (const name of groups) {

							// find or create groups
							const [group, created] = await Group.findOrCreate({
								where: {name, user_id: user.id},
								defaults: {name, user_id: user.id},
								transaction: t
							})

							// assign contact to groups
							if (group) await ContactGroup.findOrCreate({
								where: {contact_id: contact.id, group_id: group.id},
								defaults: {contact_id: contact.id, group_id: group.id},
								transaction: t
							})
						}
					}

					// assign msisdn to contact and user
					await ContactMsisdnUser.create({
						msisdn_id: msisdn.id, contact_id: contact.id, user_id: user.id
					}, { transaction: t })
				}
			}

			if (contact) return Contact.findByPk(contact.id,{
				attributes: ['id', 'first_name', 'middle_name', 'last_name', 'created_at'],
				include: {
					model: Msisdn,
					attributes: ['id'],
					through: {attributes: []},
				}
			})

			return null

		})

	}
	catch (error)
	{
		logger.log("error creating contact: ", error)

		return null
	}
}