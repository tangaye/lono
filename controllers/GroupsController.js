const Group = require("../models/Group")
const GroupFactory = require("../factories/GroupsFactory")
const constants = require("../constants")
const logger = require("../logger")
const helper = require("../helpers")
const database = require("../database/connection")
const {QueryTypes} = require("sequelize")
const Contact = require("../models/Contact");
const Msisdn = require("../models/Msisdn");
const ContactGroup = require("../models/ContactGroup");

exports.all = async (request, response) => {

	try {

		const {user} = request.body
		const { page, size, search, order} = request.query
		const { limit, offset} = helper.getPagination(page, size)

		const replacements = GroupFactory.buildReplacements(user.id, search, limit, offset)
		const query_string = GroupFactory.queryGroups(search, order)

		const count = await Group.count({
			where: {user_id: user.id},
			distinct: true
		})

		const results = await database.query(query_string, {
			replacements,
			type: QueryTypes.SELECT
		})

		if (results) return helper.respond(response, {
			code: constants.SUCCESS_CODE,
			...GroupFactory.getPagingData(results, count, page, limit)
		})

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: "error fetching groups"
		})

	}
	catch (error)
	{
		const message = "error fetching groups"
		logger.error(message, error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: error?.errors ? error?.errors[0]?.message : message
		})
	}

}

exports.store = async (request, response) => {

    // start transaction
    const t = await database.transaction();

	try
	{
		const {name, description, user, contacts} = request.body

		const group = await Group.create({
			name,
            description,
            user_id: user.id
		}, {transaction: t})

		// assign to contacts
		if (contacts && contacts.length > 0) {

			for (const id of contacts)
			{

			    await ContactGroup.create({
					contact_id: id,
                    group_id: group.id
				}, {transaction: t})
			}

		}

         // If the execution reaches this line, no errors were thrown.
        // We commit the transaction.
        await t.commit();

        const created_group = await Group.findByPk(group.id,{
			attributes: ['id', 'description', 'name'],
			include: {
                model: Contact,
                attributes: ['id', 'first_name', 'middle_name', 'last_name'],
                through: {attributes: []}
            }
		})

        return helper.respond(response, {
			code: constants.SUCCESS_CODE,
			group: created_group
		})

	}
	catch (error)
	{
        // If the execution reaches this line, an error was thrown.
        // We rollback the transaction.
        await t.rollback();

		const message = "error creating groups"
		logger.error(message, error)

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
            const  group = await database.query(GroupFactory.getGroupQuery(), {
                replacements: {id, user_id: user.id},
                type: QueryTypes.SELECT
            })

			if (group) return helper.respond(response, {
				code: constants.SUCCESS_CODE,
				group: group[0]
			})

			return response.send({
				errorCode: constants.FAILURE_CODE,
				message: "group not found"
			})
		}

		return response.send({
			errorCode: constants.FAILURE_CODE,
			message: "id is required in request param"
		})


	}
	catch (error)
	{
		const message = "error fetching group"
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

        const {user, name, contacts, description, group} = request.body

        await group.update({
            name: name || group.name,
            description: description || group.description
        }, {transaction: t})

        // if contacts not passed, remove all contacts assigned
        if (!contacts || contacts?.length === 0) {
            await database.query(
                `delete from contact_groups where group_id = :group_id`, {
                replacements: { group_id: group.id},
                type: QueryTypes.DELETE,
                transaction: t
            })
        }

        if (contacts?.length > 0)
        {

            const values = contacts.map(id => `(gen_random_uuid(), '${group.id}', '${id}', now(), now())`).join(', ');

            // remove contacts not reassigned
            await database.query(
                `delete from contact_groups where group_id = :group_id and contact_id not in (:contacts)`, {
                replacements: { group_id: group.id, contacts},
                type: QueryTypes.DELETE,
                transaction: t
            })

            await database.query(
                `insert into contact_groups (id, group_id, contact_id, created_at, updated_at) values ${values} ON CONFLICT DO NOTHING`
                , {
                replacements: {values},
                type: QueryTypes.INSERT,
                transaction: t
            })
        }


        // If the execution reaches this line, no errors were thrown.
        // We commit the transaction.

        const updated_group = await database.query(GroupFactory.getGroupQuery(), {
            replacements: {id: group.id, user_id: user.id},
            type: QueryTypes.SELECT,
            transaction: t
        })

        await t.commit();

        return response.send({
            errorCode: constants.SUCCESS_CODE,
            group: updated_group[0]
        })

	}
	catch (error)
	{

        // If the execution reaches this line, an error was thrown.
        // We rollback the transaction.
        await t.rollback();


		const message = "error updating group"
		logger.error(message, error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: error?.errors ? error?.errors[0]?.message : message
		})
	}
}

exports.remove = async (request, response) => {
    try {

		const {user} = request.body
		const id = request.params.id

		if (id)
		{
			const group = await Group.findByPk(id, {where: {user_id: user.id}})

			if (group) {

                await group.destroy({force: true});

                return helper.respond(response, {
                    code: constants.SUCCESS_CODE,
                    message: "group deleted"
                })
            }

			return response.send({
				errorCode: constants.FAILURE_CODE,
				message: "group not found"
			})
		}

		return response.send({
			errorCode: constants.FAILURE_CODE,
			message: "id is required in request param"
		})
	}
	catch (error)
	{
		const message = "error deleting group"
		logger.error(message, error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: error?.errors ? error?.errors[0]?.message : message
		})
	}
}