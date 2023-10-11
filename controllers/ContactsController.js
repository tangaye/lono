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
			const contact = await database.query(ContactFactory.getContactQuery(), {
                replacements: { id, user_id: user.id},
                type: QueryTypes.SELECT
            })

			if (contact) return helper.respond(response, {
				code: constants.SUCCESS_CODE,
				contact: contact[0]
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

exports.update = async (request, response) => {

    // start transaction
    const t = await database.transaction();

    try {

        const {user, first_name, middle_name, last_name, msisdns, groups, contact} = request.body

        await contact.update({
            first_name: first_name || contact.first_name,
            middle_name: middle_name || contact.middle_name,
            last_name: last_name || contact.last_name,
        }, {transaction: t})

        // if groups not passed, remove all assigned assigned
        if (!groups || groups?.length === 0) {
            await database.query(
                `delete from contact_groups where contact_id = :contact_id`, {
                replacements: { contact_id: contact.id},
                type: QueryTypes.DELETE,
                transaction: t
            })
        }

        // if msisdns not passed, remove all msisdns assigned
        if (!msisdns || msisdns?.length === 0) {
            await database.query(
                `delete from contact_msisdns where contact_id = :contact_id`, {
                replacements: { contact_id: contact.id},
                type: QueryTypes.DELETE,
                transaction: t
            })
        }

        if (groups?.length > 0)
        {

            // remove groups not reassigned
            await database.query(
                `delete from contact_groups where contact_id = :contact_id and group_id not in (:groups)`, {
                replacements: { contact_id: contact.id, groups},
                type: QueryTypes.DELETE,
                transaction: t
            })

            const values = groups.map(id => `(gen_random_uuid(), '${id}', '${contact.id}', now(), now())`).join(', ');

            await database.query(
                `insert into contact_groups (id, group_id, contact_id, created_at, updated_at) values ${values} ON CONFLICT DO NOTHING`
                , {
                replacements: {values},
                type: QueryTypes.INSERT,
                transaction: t
            })
        }

        if (msisdns?.length > 0)
        {
            // remove msisdns not reassigned
            await database.query(
                `delete from contact_msisdns where contact_id = :contact_id and msisdn_id not in (select id from msisdns where number in (:msisdns))`, {
                replacements: { contact_id: contact.id, msisdns},
                type: QueryTypes.DELETE,
                transaction: t
            })

            for (const number of msisdns)
            {
                const msisdn = await Msisdn.findOne({
                    where: {number, user_id: user.id},
                    transaction: t
                })

                if (msisdn)
                {

                    await database.query(
                        `insert into contact_msisdns (id, contact_id, msisdn_id, created_at, updated_at) values (gen_random_uuid(), :contact_id, :msisdn_id, now(), now()) ON CONFLICT DO NOTHING`
                        , {
                        replacements: {
                            contact_id: contact.id,
                            msisdn_id: msisdn.id
                        },
                        type: QueryTypes.INSERT,
                        transaction: t
                    })
                }
                else
                {

                    const msisdn = await Msisdn.create({
                        number,
                        user_id: user.id
                    }, {transaction: t})

                    await database.query(
                        `insert into contact_msisdns (id, contact_id, msisdn_id, created_at, updated_at) values (gen_random_uuid(), :contact_id, :msisdn_id, now(), now())`
                        , {
                        replacements: {
                            contact_id: contact.id,
                            msisdn_id: msisdn.id
                        },
                        type: QueryTypes.INSERT,
                        transaction: t
                    })

                }
            }

        }


        // If the execution reaches this line, no errors were thrown.
        // We commit the transaction.

        const updated_contact = await database.query(ContactFactory.getContactQuery(), {
            replacements: { id: contact.id, user_id: user.id},
            type: QueryTypes.SELECT,
            transaction: t
        })

        await t.commit();

        return response.send({
            errorCode: constants.SUCCESS_CODE,
            contact: updated_contact[0]
        })

	}
	catch (error)
	{

        // If the execution reaches this line, an error was thrown.
        // We rollback the transaction.
        await t.rollback();


		const message = "error updating contact"
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
                const created = await Msisdn.create({
                    number: msisdn,
                    user_id: user.id
                }, {transaction: t})

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


        const created_contact = await database.query(ContactFactory.getContactQuery(), {
            replacements: { id: contact.id, user_id: user.id},
            type: QueryTypes.SELECT,
            transaction: t
        })

         // If the execution reaches this line, no errors were thrown.
        // We commit the transaction.
        await t.commit();


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
            for (const msisdn of msisdns)
            {
                // find or create msisdns
                await Msisdn.findOrCreate({
                    where: {number: msisdn, user_id: user.id},
                    defaults: {number: msisdn, user_id: user.id},
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