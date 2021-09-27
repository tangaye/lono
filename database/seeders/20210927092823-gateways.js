'use strict';

const { v4: uuidv4 } = require("uuid")
const Gateway = require("../../models/Gateway")

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
     let gateway_count = await Gateway.count();

     // Insert only when there are no records
     if (gateway_count > 0) {
         console.log("\x1b[36m", "gateway table is already seeded!", "\x1b[0m");
         return;
     }

     await queryInterface.bulkInsert(
         "gateways",
         [
             {
                 id: uuidv4(),
                 name: "Twilio",
                 slug: "twilio",
                 active: false,
                 created_at: new Date(Date.now()).toISOString(),
                 updated_at: new Date(Date.now()).toISOString(),
             },
             {
                 id: uuidv4(),
                 name: "Bulkgate",
                 slug: "bulkgate",
                 active: true,
                 created_at: new Date(Date.now()).toISOString(),
                 updated_at: new Date(Date.now()).toISOString(),
             }
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
     await queryInterface.bulkDelete("gateways", null, {});
  }
};
