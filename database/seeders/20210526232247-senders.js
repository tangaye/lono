"use strict";

const {
	v4: uuidv4
} = require("uuid");

const User = require("../../models/User");
const Sender = require("../../models/Sender");

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
		let sender_count = await Sender.count();

		// Insert only when there are no records
		if (sender_count > 0) {
			console.log("\x1b[36m", "senders table is already seeded!", "\x1b[0m");
			return;
		}

		let users = await User.findAll();

		if (users.length > 0) {
			await queryInterface.bulkInsert(
				"senders",
				[{
						id: uuidv4(),
						name: "Ponitor",
						user_id: users[0].id,
						created_at: new Date(Date.now()).toISOString(),
						updated_at: new Date(Date.now()).toISOString(),
					},
					{
						id: uuidv4(),
						name: "Lono",
						user_id: users[0].id,
						created_at: new Date(Date.now()).toISOString(),
						updated_at: new Date(Date.now()).toISOString(),
					},
					{
						id: uuidv4(),
						name: "KIT",
						user_id: users[0].id,
						created_at: new Date(Date.now()).toISOString(),
						updated_at: new Date(Date.now()).toISOString(),
					},
					{
						id: uuidv4(),
						name: "Kwagei",
						user_id: users[0].id,
						created_at: new Date(Date.now()).toISOString(),
						updated_at: new Date(Date.now()).toISOString(),
					}
				], {}
			);
		}
	},

	down: async (queryInterface, Sequelize) => {
		/**
		 * Add commands to revert seed here.
		 *
		 * Example:
		 * await queryInterface.bulkDelete('People', null, {});
		 */
		await queryInterface.bulkDelete("senders", null, {});
	},
};