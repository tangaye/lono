"use strict";

const { v4: uuidv4 } = require("uuid");

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
		let user_count = await User.count();

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
					name: "Ponitor Web App",
                    credits: 833,
                    allow_overdraft: false,
					api_key: "JH9fVVs74LBace3k7tZ43T",
					created_at: new Date(Date.now()).toISOString(),
					updated_at: new Date(Date.now()).toISOString(),
				},
				{
					id: uuidv4(),
					name: "Cititrust Bank",
					api_key: "u7AdX2aYyMnPnnrZRY4MA8",
                    allow_overdraft: true,
                    credits: 16666,
					created_at: new Date(Date.now()).toISOString(),
					updated_at: new Date(Date.now()).toISOString(),
				},
				{
					id: uuidv4(),
					name: "Lono Web App",
                    credits: 833,
                    allow_overdraft: false,
					api_key: "4qdTrFm6jh4peHownGb42R",
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
