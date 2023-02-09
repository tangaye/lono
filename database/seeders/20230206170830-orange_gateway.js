'use strict';

const { v4: uuidv4 } = require("uuid");
const Gateway = require("../../models/Gateway");

module.exports = {
	up: async (queryInterface, Sequelize) => {
		/**
		 * Add seed commands here.
		 *
		 * Example:
		 * 
		 * await queryInterface.bulkInsert('People', [{
		 *   name: 'John Doe',
		 *   isBetaMember: false
		 * }], {});
		*/
		const orange_user_found = await Gateway.findOne({
			where: {slug: "orange"}
		});

		// Insert only when there are no records
		if (orange_user_found) {
			console.log("\x1b[36m", "gateways table is already seeded with 'orange' gateway!", "\x1b[0m");
			return;
		}

		await queryInterface.bulkInsert(
			"gateways",
			[
				{
					id: uuidv4(),
					name: "Orange",
					slug: "orange",
					active: false,
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
		await queryInterface.bulkDelete('gateways', {slug: "orange"}, {})
	}
};
