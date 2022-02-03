'use strict';

module.exports = {
	up: async (queryInterface, Sequelize) => {
		/**
		 * Add altering commands here.
		 *
		 * Example:
		 * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
		 */

		// add fk constraint to msisdn_id
		await queryInterface.addConstraint('messages', {
			fields: ['msisdn_id'],
			type: 'foreign key',
			name: 'messages_msisdn_fk',
			references: { //Required field
				table: 'msisdns',
				field: 'id'
			},
			onDelete: 'cascade',
			onUpdate: 'cascade'
		});

	},

	down: async (queryInterface, Sequelize) => {
		/**
		 * Add reverting commands here.
		 *
		 * Example:
		 * await queryInterface.dropTable('users');
		 */

		await queryInterface.removeConstraint("messages", "messages_msisdn_fk")
	}
};
