"use strict";

const { v4: uuidv4 } = require("uuid");
const helpers = require("../../helpers")
const User = require("../../models/User");
const constants = require("../../constants");

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
		const user_count = await User.count();

		// Insert only when there are no records
		if (user_count > 0) {
			console.log("\x1b[36m", "users table is already seeded!", "\x1b[0m");
			return;
		}

		await queryInterface.bulkInsert(
			"users",
			[
				{
					id: uuidv4(),
					name: "Lono Demo",
					role: constants.CLIENT_ROLE,
                    credits: 500,
                    allow_overdraft: false,
					api_key: helpers.generateSecret(),
					created_at: new Date(Date.now()).toISOString(),
					updated_at: new Date(Date.now()).toISOString(),
				},
				{
					id: uuidv4(),
					name: "Kwagei Group",
					role: constants.CLIENT_ROLE,
                    credits: 1000,
                    allow_overdraft: false,
					api_key: helpers.generateSecret(),
					created_at: new Date(Date.now()).toISOString(),
					updated_at: new Date(Date.now()).toISOString(),
				},
			],
			{}
		);
	},

	down: async (queryInterface, Sequelize) => {
		/**
		 * Add commands to revert seed here.
		 *
		 * Example:
		 * await queryInterface.bulkDelete('People', null, {});
		 */
		await queryInterface.bulkDelete("users", null, {});
	},
};
