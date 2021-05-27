"use strict";

const { v4: uuidv4 } = require("uuid");

const Client = require("../../models/Client");
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

		let clients = await Client.findAll();

		if (clients.length > 0) {
			await queryInterface.bulkInsert(
				"senders",
				[
					{
						id: uuidv4(),
						name: "Ponitor",
						client_id: clients[0].id,
						created_at: new Date(Date.now()).toISOString(),
						updated_at: new Date(Date.now()).toISOString(),
					},
					{
						id: uuidv4(),
						name: "Lono",
						client_id: clients[2].id,
						created_at: new Date(Date.now()).toISOString(),
						updated_at: new Date(Date.now()).toISOString(),
					},
					{
						id: uuidv4(),
						name: "KIT",
						client_id: clients[2].id,
						created_at: new Date(Date.now()).toISOString(),
						updated_at: new Date(Date.now()).toISOString(),
					},
					{
						id: uuidv4(),
						name: "Kwagei",
						client_id: clients[2].id,
						created_at: new Date(Date.now()).toISOString(),
						updated_at: new Date(Date.now()).toISOString(),
					},
					{
						id: uuidv4(),
						name: "LAGSL LSAT",
						client_id: clients[2].id,
						created_at: new Date(Date.now()).toISOString(),
						updated_at: new Date(Date.now()).toISOString(),
					},
					{
						id: uuidv4(),
						name: "KISS",
						client_id: clients[2].id,
						created_at: new Date(Date.now()).toISOString(),
						updated_at: new Date(Date.now()).toISOString(),
					},
					{
						id: uuidv4(),
						name: "Cititrust",
						client_id: clients[1].id,
						created_at: new Date(Date.now()).toISOString(),
						updated_at: new Date(Date.now()).toISOString(),
					},
				],
				{}
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
