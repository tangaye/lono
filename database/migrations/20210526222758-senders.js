"use strict";

module.exports = {
	up: async (queryInterface, Sequelize) => {
		/**
		 * Add altering commands here.
		 *
		 * Example:
		 * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
		 */
		await queryInterface.createTable("senders", {
			id: {
				allowNull: false,
				primaryKey: true,
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
			},
			name: {
				type: Sequelize.STRING(11),
				allowNull: false,
				unique: true,
				notNull: {
					msg: "name is required",
				},
				comment: "sender name for sending messages",
			},
			client_id: {
				type: Sequelize.UUID,
				allowNull: false,
				notNull: {
					msg: "client_id is required",
				},
				onDelete: "CASCADE",
				references: {
					model: "clients",
					key: "id",
					as: "client_id",
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
		await queryInterface.dropTable("senders");
	},
};
