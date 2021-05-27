"use strict";

const { v4: uuidv4 } = require("uuid");

const Client = require("../../models/Client");

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
		let client_count = await Client.count();

		// Insert only when there are no records
		if (client_count > 0) {
			console.log("\x1b[36m", "clients table is already seeded!", "\x1b[0m");
			return;
		}

		await queryInterface.bulkInsert(
			"clients",
			[
				{
					id: uuidv4(),
					name: "Ponitor Web App",
					api_key: uuidv4(),
					created_at: new Date(Date.now()).toISOString(),
					updated_at: new Date(Date.now()).toISOString(),
				},
				{
					id: uuidv4(),
					name: "Cititrust Bank",
					api_key: uuidv4(),
					created_at: new Date(Date.now()).toISOString(),
					updated_at: new Date(Date.now()).toISOString(),
				},
				{
					id: uuidv4(),
					name: "Lono Web App",
					api_key: uuidv4(),
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
		await queryInterface.bulkDelete("clients", null, {});
	},
};
