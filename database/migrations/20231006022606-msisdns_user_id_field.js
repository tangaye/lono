'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
        await queryInterface.addColumn("msisdns", "user_id", {
                allowNull: true,
                type: Sequelize.UUID,
                onDelete: "RESTRICT",
                references: {
                    model: "users",
                    key: "id",
                    as: "user_id",
                },
        });
    },

    async down (queryInterface, Sequelize) {
        /**
         * Add reverting commands here.
         *
         * Example:
         * await queryInterface.dropTable('users');
         */
        await queryInterface.removeColumn('msisdns', 'user_id')
    }
};

