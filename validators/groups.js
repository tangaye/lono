const helper = require("../helpers")
const constants = require("../constants")
const logger = require("../logger");
const Group = require("../models/Group");
const Contact = require("../models/Contact");

/**
 * Validates and prepares requests to display apps
 * @param {Request} request
 * @param {Response} response
 * @param {next} next
 * @returns
 */
exports.validateAll = (request, response, next) => {

	const id = request.query.id;

	if (id && !helper.isValidUuid(id)) {
		return helper.respond(response, {message: "invalid id"})
	}

	return next()
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

		const {name, user, contacts} = request.body

        if (!name)
        {
            return helper.respond(response, {
                code: constants.INVALID_DATA,
                message: `group name is required`
            })
        }

        const name_exists = await Group.findOne({where: {name}})

        if (name_exists)
        {
            return helper.respond(response, {
                code: constants.INVALID_DATA,
                message: `group: "${name}" already exists`
            })
        }

        if (contacts)
        {

            const unique_contacts = []

            for (const id of contacts)
            {
                // check if id is valid
                if(!helper.isValidUuid(id))
                {
                    return helper.respond(response, {
                        code: constants.INVALID_DATA,
                        message: `Invalid contact id: ${id}`
                    })
                }

                // check for duplicates
                if (unique_contacts.includes(id))
                {
                    return helper.respond(response, {
                        code: constants.INVALID_DATA,
                        message: `Duplicate contact found for: ${id}`
                    })
                }
                unique_contacts.push(id)

                const contact_found = await Contact.findByPk(id)

                if (!contact_found) {
                    return helper.respond(response, {
                        code: constants.INVALID_DATA,
                        message: `Invalid contact. No record found for: ${id}`
                    })
                }
            }
        }

        return next()


	} catch (error) {

		logger.error("error validating data to store group: ", error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: "error validating data to store group"
		})

	}
}