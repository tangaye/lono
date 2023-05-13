'use strict';
const { v4: uuidv4 } = require("uuid");
const Gateway = require("../../models/Gateway");

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
    const dseven_found = await Gateway.findOne({
        where: {slug: "dseven"}
    });

    // Insert only when there are no records
    if (dseven_found) {
        console.log("\x1b[36m", "gateways table is already seeded with 'dseven' gateway!", "\x1b[0m");
        return;
    }

    await queryInterface.bulkInsert(
        "gateways",
        [
            {
                id: uuidv4(),
                name: "DSeven",
                slug: "dseven",
                queue: "dseven_messages_queue",
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
    await queryInterface.bulkDelete('gateways', {slug: "dseven"}, {})
  }
};
