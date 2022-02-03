'use strict';

module.exports = {
	up: async (queryInterface, Sequelize) => {
		/**
		 * Add altering commands here.
		 *
		 * Example:
		 * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
		 */
		await queryInterface.addColumn("messages", "alt_gateway_id", {
			allowNull: true,
			type: Sequelize.UUID,
			onDelete: "RESTRICT",
			references: {
				model: "gateways",
				key: "id",
				as: "gateway_id",
			},
		});

		await queryInterface.addColumn("messages", "alt_gateway_message_id", {
			type: Sequelize.STRING,
			allowNull: true,
			unique: true,
		});

		await queryInterface.addColumn("messages", "retries", {
			type: Sequelize.INTEGER,
			allowNull: true
		});

	},

	down: async (queryInterface, Sequelize) => {
		/**
		 * Add reverting commands here.
		 *
		 * Example:
		 * await queryInterface.dropTable('users');
		 */
		await queryInterface.removeColumn('messages', 'alt_gateway_id')
		await queryInterface.removeColumn('messages', 'alt_gateway_message_id')
		await queryInterface.removeColumn('messages', 'retries')
	}
};
