"use strict";

module.exports = {
	up: async (queryInterface, Sequelize) => {
		/**
		 * Add altering commands here.
		 *
		 * Example:
		 * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
		 */
		await queryInterface.createTable("clients", {
			id: {
				allowNull: false,
				primaryKey: true,
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
			},
			name: {
				type: Sequelize.STRING,
				allowNull: false,
				unique: true,
				notNull: {
					msg: "name is required",
				},
			},
			api_key: {
				type: Sequelize.STRING,
				allowNull: false,
				unique: true,
				notNull: {
					msg: "api_key is required",
				},
			},
			created_at: {
				allowNull: false,
				type: Sequelize.DATE,
			},
			updated_at: {
				allowNull: false,
				type: Sequelize.DATE,
			},
		});
	},

	down: async (queryInterface, Sequelize) => {
		/**
		 * Add reverting commands here.
		 *
		 * Example:
		 * await queryInterface.dropTable('users');
		 */
		await queryInterface.dropTable("clients");
	},
};
