const helper = require("../helpers")
const MsisdnFactory = require("../factories/MsisdnsFactory")
const GroupFactory = require("../factories/GroupsFactory")
const constants = require("../constants")
const logger = require("../logger")
const Msisdn = require("../models/Msisdn")
const Group = require("../models/Group")
const Contact = require("../models/Contact")

/**
 * Validates and prepares requests to display apps
 * @param {Request} request
 * @param {Response} response
 * @param {next} next
 * @returns
 */
exports.validateAll = (request, response, next) => {

	const id = request.query.id;

	if (id && !helper.isValidUuid(id)) return helper.respond(response, {message: "invalid id"})

	return next()
}

/**
 * Validates and prepares requests to store apps
 * @param {Request} request
 * @param {Response} response
 * @param {next} next
 * @returns
 */
exports.validateCreate = async (request, response, next) => {

	try {

		const {first_name, last_name, msisdns, groups, user} = request.body


        // user and msisdn required
        if (!user || !first_name || !last_name) {

            return helper.respond(response, {
                code: constants.INVALID_DATA,
                message: "first_name and last_name are required"
            })
        }

        if (msisdns)
        {

            const unique_msisdns = []

            // check if msisdn exists, if so return error
            for (const number of msisdns)
            {

                // check if msisdn is valid
                if(!MsisdnFactory.validateMsisdn(number))
                {
                    return helper.respond(response, {
                        code: constants.INVALID_DATA,
                        message: `Invalid msisdn: ${number}`
                    })
                }

                // check for duplicates
                if (unique_msisdns.includes(number))
                {
                    return helper.respond(response, {
                        code: constants.INVALID_DATA,
                        message: `Duplicate msisdn found for: ${number}`
                    })
                }

                unique_msisdns.push(number)

                // check if msisdn has been assigned to a user
                const msisdn_found = await Msisdn.findOne({
                    where: {number, user_id: user.id}
                })

                if (msisdn_found)
                {
                    return helper.respond(response, {
                        code: constants.INVALID_DATA,
                        message: `msisdn: "${number}" already exists`
                    })
                }
            }
        }

        if (groups)
        {
            const unique_groups = [];
            // check if all groups exists
            for (const id of groups)
            {

                // check for duplicates
                if (unique_groups.includes(id))
                {
                    return helper.respond(response, {
                        code: constants.INVALID_DATA,
                        message: `Duplicate group found for: ${id}`
                    })
                }

                unique_groups.push(id)

                // check if valid uuid
                if (!helper.isValidUuid(id))
                {
                    return helper.respond(response, {
                        code: constants.INVALID_DATA,
                        message: `invalid group id: ${id}`
                    })
                }

                // check if group exists
                const group_found = await Group.findOne({
                    where: {id, user_id: user.id}
                })

                if (!group_found)
                {
                    return helper.respond(response, {
                        code: constants.INVALID_DATA,
                        message: `group: ${id} doesn't exists`
                    })
                }
            }

        }


       return next();


	} catch (error) {

        const message = "error validating data to create contact: ";

		logger.error(message, error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message
		})

	}
}

exports.validateUpdate = async (request, response, next) =>
{
    try {

        const id = request.params.id
        const {user, groups, msisdns} = request.body

        const contact = await Contact.findOne({
            where: {id, user_id: user.id}
        });

        if (!contact)
        {
            return helper.respond(response, {
                code: constants.INVALID_DATA,
                message: `contact: ${id} not found`
            })
        }

        if (msisdns)
        {

            const unique_msisdns = []

            // check if msisdn exists, if so return error
            for (const id of msisdns)
            {

                // check if msisdn is valid
                if(!MsisdnFactory.validateMsisdn(id))
                {
                    return helper.respond(response, {
                        code: constants.INVALID_DATA,
                        message: `Invalid msisdn: ${id}`
                    })
                }

                // check for duplicates
                if (unique_msisdns.includes(id))
                {
                    return helper.respond(response, {
                        code: constants.INVALID_DATA,
                        message: `Duplicate msisdn found for: ${id}`
                    })
                }

                unique_msisdns.push(id)
            }
        }

        if (groups)
        {
            const unique_groups = [];
            // check if all groups exists
            for (const id of groups)
            {

                // check for duplicates
                if (unique_groups.includes(id))
                {
                    return helper.respond(response, {
                        code: constants.INVALID_DATA,
                        message: `Duplicate group found for: ${id}`
                    })
                }

                unique_groups.push(id)

                // check if valid uuid
                if (!helper.isValidUuid(id))
                {
                    return helper.respond(response, {
                        code: constants.INVALID_DATA,
                        message: `invalid group id: ${id}`
                    })
                }

                // check if group exists
                const group_found = await Group.findOne({
                    where: {id, user_id: user.id}
                })
                if (!group_found)
                {
                    return helper.respond(response, {
                        code: constants.INVALID_DATA,
                        message: `group: ${id} doesn't exists`
                    })
                }
            }

        }

        request.body.contact = contact
        return next();

    } catch (error) {
        logger.error("error validating data to update contact: ", error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: "error validating data to update contact"
		})

    }
}

exports.validateImport = async (request, response, next) =>
{
    try {

        const {contacts} = request.body


        // user and msisdn required
        if (!contacts) {

            return helper.respond(response, {
                code: constants.INVALID_DATA,
                message: "'contacts' is required"
            })
        }

        for (const contact of contacts)
        {
            if (contact.msisdns)
            {
                for (const msisdn of contact.msisdns)
                {
                     // check if msisdn is valid
                     if(!MsisdnFactory.validateMsisdn(msisdn))
                     {
                         return helper.respond(response, {
                             code: constants.INVALID_DATA,
                             message: `Invalid msisdn: ${msisdn}`
                         })
                     }
                }
            }

        }

        return next();


    } catch (error) {

        const message = "error validating data to import contact: ";

		logger.error(message, error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message
		})

    }
}

/**
 * Validates and prepares requests to store apps
 * @param {Request} request
 * @param {Response} response
 * @param {next} next
 * @returns
 */
exports.validateStore = async (request, response, next) => {

	try {

		const {msisdns, groups, user} = request.body

		if (msisdns && user) {

			const msisdns_valid = MsisdnFactory.validate(msisdns)
			const groups_valid = GroupFactory.groupsValid(groups)

			if (msisdns_valid && groups_valid) return next()

			return helper.respond(response, {
				code: constants.INVALID_DATA,
				message: "invalid msisdns"
			})

		}

		return helper.respond(response, {
			code: constants.INVALID_DATA,
			message: "msisdns & user are required"
		})


	} catch (error) {

		logger.error("error validating data to store contact: ", error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: "error validating data to store contact"
		})

	}
}

exports.validateDelete = async(request, response, next) => {
    try {

		const id = request.params.id
        const {user} = request.body

        if (!id)
        {
            return helper.respond(response, {
				code: constants.INVALID_DATA,
				message: "id is required"
			})
        }

        if(!helper.isValidUuid(id))
        {
            return helper.respond(response, {
				code: constants.INVALID_DATA,
				message: "invalid id"
			})
        }

        const contact = await Contact.findByPk(id,
            {where: {user_id: user.id},
            include: {
                model: Msisdn
            }
        })

        if (!contact)
        {
            return helper.respond(response, {
				code: constants.INVALID_DATA,
				message: `contact: ${id} not found`
			})
        }

		request.body.contact = contact
        return next();

	} catch (error) {

        const message = "error validating data to delete contact: "
		logger.error(message, error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message
		})

	}
}