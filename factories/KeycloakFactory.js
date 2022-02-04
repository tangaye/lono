const logger = require("../logger")
const KeycloakAdminClient = require('@keycloak/keycloak-admin-client').default

const kcAdminClient = new KeycloakAdminClient({
	baseUrl: `${process.env.KC_SERVER_URL}/auth`,
	realmName: process.env.KC_REALM
})

/**
 * Creates a user on keycloak
 * @param {string|required} email - user email
 * @param {string|required} password - user password
 * @param {string|required} api_key - user api key attribute
 * @return {Promise<null|{id: string}>}
 */
exports.createUser = async (email, password, api_key) => {

	try {

		// Generate token for kdp admin-cli
		await kcAdminClient.auth({
			grantType: 'client_credentials',
			clientId: process.env.KC_ADMIN_CLIENT_ID,
			clientSecret: process.env.KC_ADMIN_CLIENT_SECRET,
		})

		return await kcAdminClient.users.create({
			username: email,
			email: email,
			attributes: {
				secret: api_key
			},
			enabled: true,
			credentials: [{
				type: "password",
				value: password,
				temporary: true
			}]
		})

	}
	catch (error)
	{
		logger.error("error creating keycloak user: ", error?.response?.data ? error?.response?.data : error)
		return null
	}

}


