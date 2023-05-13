'use strict';

const { v4: uuidv4 } = require("uuid");
const Gateway = require("../../models/Gateway")
const Carrier = require("../../models/Carrier")
const GatewayCarrier = require("../../models/GatewayCarrier");

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
        const gateway_carrier_count = await GatewayCarrier.count();

		// Insert only when there are no records
		if (gateway_carrier_count > 0) {
			console.log("\x1b[36m", "gateway_carrier table is already seeded!", "\x1b[0m");
			return;
		}

        const OrangeGateway = await Gateway.findOne({
			where: {slug: "orange"}
		});

        const BulkgateGateway = await Gateway.findOne({
			where: {slug: "bulkgate"}
		});

        const OrangeCarrier = await Carrier.findOne({
            where: {name: "Orange"}
        })

        const LonestarCarrier = await Carrier.findOne({
            where: {name: "Lonestar"}
        })

		// Insert only when there are no records
		if (!(OrangeGateway && BulkgateGateway && OrangeCarrier && LonestarCarrier)) {
			console.log("\x1b[36m", "Unable to seed table gateway_carrier. OrangeGateway, BulkgateGateway, LonestarCarrier or OrangeCarrier not found!", "\x1b[0m");
			return;
		}

        await queryInterface.bulkInsert(
			"gateway_carrier",
			[
				{
					id: uuidv4(),
					gateway_id: OrangeGateway.id,
					carrier_id: OrangeCarrier.id,
					created_at: new Date(Date.now()).toISOString(),
					updated_at: new Date(Date.now()).toISOString(),
				},
				{
					id: uuidv4(),
					gateway_id: BulkgateGateway.id,
					carrier_id: LonestarCarrier.id,
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
        await queryInterface.bulkDelete("gateway_carrier", null, {});
    }
};
