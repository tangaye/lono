const ContactFactory = require("../factories/ContactsFactory")
const database = require("../database/connection")
const {QueryTypes, Sequelize} = require("sequelize")
const constants = require("../constants")
const helper = require("../helpers")
const logger = require("../logger")
const Msisdn = require("../models/Msisdn")
const Contact = require("../models/Contact")
const Group = require("../models/Group")
const User = require("../models/User")
const ContactGroup = require("../models/ContactGroup")
const ContactMsisdn = require("../models/ContactMsisdn")

exports.all = async (request, response) => {

	try {

		const user = request.body.user
		const { page, size, search, order} = request.query
		const { limit, offset} = helper.getPagination(page, size)

		const replacements = ContactFactory.buildReplacements(user.id, limit, offset)
		const query_string = ContactFactory.queryContacts(search, user.id, order)

		const count_result = await database.query(`
			SELECT count(*)
			FROM contacts
			WHERE user_id = :user_id
		`, {
			replacements: {user_id: user.id},
			type: QueryTypes.SELECT
		})

		if (count_result) {

			const count = Number(count_result[0].count)
			const results = await database.query(query_string, {
				replacements,
				type: QueryTypes.SELECT
			})

			if (results) return helper.respond(response, {
				code: constants.SUCCESS_CODE,
				...ContactFactory.getPagingData(results, count, page, limit)
			})
		}

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: "error fetching contacts"
		})
	}
	catch (error)
	{
		const message = "error fetching contacts"

		logger.log(message, error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: error?.errors ? error?.errors[0]?.message : message
		})
	}

}

exports.get = async (request, response) => {

	try
	{
        const {user} = request.body
		const id = request.params.id

		if (id)
		{
			const contact = await Contact.findByPk(id, {
                attributes: ['id', 'first_name', 'middle_name', 'last_name'],
				include: [
                    {
                        model: Msisdn,
                        through: {attributes: []},
                        attributes: ['id'],
				    },
                    {
                        model: Group,
                        through: {attributes: []},
                        attributes: ['id', 'name', 'description'],
				    },
                    {
                        model: User,
                        attributes: ['id', 'name'],
				    },

                ],
                where: {user_id: user.id}
			})

			if (contact) return helper.respond(response, {
				code: constants.SUCCESS_CODE,
				contact
			})

			return response.send({
				errorCode: constants.FAILURE_CODE,
				message: "contact not found"
			})
		}

		return response.send({
			errorCode: constants.FAILURE_CODE,
			message: "id is required in request param"
		})


	}
	catch (error)
	{
		const message = "error fetching contact"
		logger.error(message, error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: error?.errors ? error?.errors[0]?.message : message
		})
	}


}

exports.create = async (request, response) =>
{
    // start transaction
    const t = await database.transaction();

    try {


        const {first_name, middle_name, last_name, msisdns, groups, user} = request.body

        let contact;
        const created_msisdns = [];

        // create contact if first name and last name exists
        if (first_name && last_name)
        {
            contact = await Contact.create({
                first_name,
                middle_name,
                last_name,
                user_id: user.id
            }, {transaction: t})
        }

        // create msisdns
        if (msisdns)
        {
            for (const msisdn of msisdns)
            {
                const created = await Msisdn.create({id: msisdn}, {transaction: t})

                created_msisdns.push(created);
            }
        }

        // assign to contacts if both created
        if (contact && created_msisdns)
        {
            for (const msisdn of created_msisdns)
            {
                await ContactMsisdn.create({
                    msisdn_id: msisdn.id,
                    contact_id: contact.id
                }, {transaction: t})
            }
        }

        // add groups to contacts
        if (contact && groups)
        {
            for (const id of groups) {

                const contact_group = await ContactGroup.create({
                    contact_id: contact.id,
                    group_id: id
                }, {transaction: t})
            }
        }

        // If the execution reaches this line, no errors were thrown.
        // We commit the transaction.
        await t.commit();

        const created_contact = await Contact.findByPk(contact.id,{
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

        return helper.respond(response, {
			code: constants.SUCCESS_CODE,
			contact: created_contact
		})


    } catch (error) {

        const message = "error creating contact"
		logger.log(message, error)


        // If the execution reaches this line, an error was thrown.
        // We rollback the transaction.
        await t.rollback();

        return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message
		})
    }
}

exports.remove = async (request, response) => {
    try {

		const {user} = request.body
		const id = request.params.id

		if (id)
		{
			const contact = await Contact.findByPk(id, {where: {user_id: user.id}})

			if (contact) {

                await contact.destroy({force: true});

                return helper.respond(response, {
                    code: constants.SUCCESS_CODE,
                    message: "contact deleted"
                })
            }

			return response.send({
				errorCode: constants.FAILURE_CODE,
				message: "contact not found"
			})
		}

		return response.send({
			errorCode: constants.FAILURE_CODE,
			message: "id is required in request param"
		})
	}
	catch (error)
	{
		const message = "error deleting contact"
		logger.error(message, error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: error?.errors ? error?.errors[0]?.message : message
		})
	}
}

exports.bulkImport = async (request, response) => {

    // start transaction
    const t = await database.transaction();

	try {

		const {contacts, user} = request.body

        // loop through contacts
        for (const contact of contacts)
        {

            const {first_name, middle_name, last_name, groups, msisdns} = contact;

            // create contact
            const created_contact = await  Contact.create({
                first_name,
                middle_name,
                last_name,
                user_id: user.id
            }, {transaction: t})

            // loop through groups
            for (const name of groups)
            {
                // find or create group
                const [group, created] = await Group.findOrCreate({
                    where: {name: name, user_id: user.id},
                    defaults: {name: name, user_id: user.id},
                    transaction: t
                })

                // add group to contact
                if (group) await ContactGroup.findOrCreate({
                    where: {contact_id: created_contact.id, group_id: group.id},
                    defaults: {contact_id: created_contact.id, group_id: group.id},
                    transaction: t
                })
            }

            // loop through msisdns
            for (const id of msisdns)
            {
                // find or create msisdns
                await Msisdn.findOrCreate({
                    where: {id},
                    defaults: {id, user_id: user.id},
                    transaction: t
                })
            }
        }

        // If the execution reaches this line, no errors were thrown.
        // We commit the transaction.
        await t.commit();

        return helper.respond(response, {
			code: constants.SUCCESS_CODE,
			contacts
		})


	}
	catch (error)
	{
		const message = "error bulk importing"
		logger.log(message, error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: error?.errors ? error?.errors[0]?.message : message
		})
	}
}