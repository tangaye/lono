'use strict';

const { v4: uuidv4 } = require("uuid");
const Carrier = require("../../models/Carrier");

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
        const carrier_count = await Carrier.count();

		// Insert only when there are no records
		if (carrier_count > 0) {
			console.log("\x1b[36m", "carriers table is already seeded!", "\x1b[0m");
			return;
		}

        await queryInterface.bulkInsert(
			"carriers",
			[
				{
					id: uuidv4(),
					name: "Orange",
					msisdn_prefix: ["23177"],
					created_at: new Date(Date.now()).toISOString(),
					updated_at: new Date(Date.now()).toISOString(),
				},
				{
					id: uuidv4(),
					name: "Lonestar",
                    msisdn_prefix: ["23188", "23155"],
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
        await queryInterface.bulkDelete("carriers", null, {});
    }
};
