const User = require("../models/User")
const Sender = require("../models/Sender")
const constants = require("../constants")
const logger = require("../logger")
const helper = require("../helpers")
const KeycloakFactory = require("../factories/KeycloakFactory")


exports.all = async (request, response) => {

	try {

		const {where_clause} = request.body

		const users = await User.findAll({
			attributes: ["id", "name", "credits", "email", "allow_overdraft", ["api_key", "apiKey"]],
			include: { model: Sender, attributes: ["id", "name"] },
			where: where_clause || null
		})

		if (users) return helper.respond(response, {
			code: constants.SUCCESS_CODE,
			users
		})

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: "error fetching users"
		})

	} catch (error) {

		const message = "error fetching users"

		logger.log(message, error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: error?.errors ? error?.errors[0]?.message : message
		})
	}
};

exports.store = async (request, response) => {
	try {

		const {name, email, credits, password, api_key, senders} = request.body

		const result = await KeycloakFactory.createUser(email, password, api_key)

		console.log({result})

		if (result)
		{
			const user = await User.create({name, email, credits, api_key})

			if (user) {

				for (const sender of senders) {

					await Sender.findOrCreate({
						where: {name: sender, user_id: user.id},
						defaults: {name: sender, user_id: user.id}
					})
				}

				user.dataValues.password = password

				return helper.respond(response, {
					code: constants.SUCCESS_CODE,
					user
				})
			}
		}

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: "error creating user"
		})
	}
	catch (error)
	{
		const message = "error creating users"

		logger.log(message, error)

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: error?.errors ? error?.errors[0]?.message : message
		})
	}
}


exports.details = async (request, response) => {

    try {

		const user = request.body.user

		if (user) return response.send({

			errorCode: constants.SUCCESS_CODE,

			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				apiKey: user.api_key,
				senderNames: user.senders,
				smsCredits: user.credits,
				dateCreated: user.created_at
			}

		})

        return response.status(constants.NOTFOUND).send({
			errorCode: constants.FAILURE_CODE, message: "user not found"
		})

    } catch (error) {

		const message = "error getting user details"

		return helper.respond(response, {
			code: constants.FAILURE_CODE,
			message: error?.errors ? error?.errors[0]?.message : message
		})
    }
}

/**
 * Updates the user credits
 * @param {UUID} id - user id
 * @returns
 */
exports.updateCredits = async id => {

    try {

        const user = await User.findByPk(id)

        if (user) {

            const credits = user.credits - constants.SMS_TARIFF;

            return await user.update({credits})
        }

    } catch (error) {
        logger.log("error updateCredits: ", error)
    }
}
