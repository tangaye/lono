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
    await queryInterface.addConstraint('contact_msisdns', {
        fields: ['contact_id', 'msisdn_id', 'user_id'],
        type: 'unique',
        name: 'unique_contact_id_msisdn_id'
      });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeConstraint('contact_msisdns', 'unique_contact_id_msisdn_id')
  }
};
