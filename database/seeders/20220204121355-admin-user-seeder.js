"use strict";

const { v4: uuidv4 } = require("uuid");
const helpers = require("../../helpers")
const constants = require("../../constants")
const User = require("../../models/User");

module.exports = {
	up: async (queryInterface, Sequelize) => {
		/**
		 * Add seed commands here.
		 *
		 * Example:
		 * await queryInterface.bulkInsert('People', [{
		 *   name: 'John Doe',
		 *   isBetaMember: false
		 * }], {});
		 */
		const admin_user_found = await User.findOne({
			where: {role: constants.ADMIN_ROLE}
		});

		// Insert only when there are no records
		if (admin_user_found) {
			console.log("\x1b[36m", "users table is already seeded with admin user!", "\x1b[0m");
			return;
		}

		await queryInterface.bulkInsert(
			"users",
			[
				{
					id: uuidv4(),
					name: "Admin",
					role: constants.ADMIN_ROLE,
					credits: 0,
					allow_overdraft: false,
					api_key: helpers.generateApiKey(),
					created_at: new Date(Date.now()).toISOString(),
					updated_at: new Date(Date.now()).toISOString(),
				}
			],
			{}
		)
	},

	down: async (queryInterface, Sequelize) => {
		/**
		 * Add commands to revert seed here.
		 *
		 * Example:
		 * await queryInterface.bulkDelete('People', null, {});
		 */
		await queryInterface.bulkDelete('users', {role: constants.ADMIN_ROLE}, {})
	},
};
