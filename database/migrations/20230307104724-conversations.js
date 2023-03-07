"use strict";

module.exports = {
	up: async (queryInterface, Sequelize) => {
		/**
		 * Add altering commands here.
		 *
		 * Example:
		 * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
		 */
		await queryInterface.createTable("conversations", {
			id: {
				allowNull: false,
				primaryKey: true,
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
			},
			from: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			to: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			message: {
				type: Sequelize.TEXT,
				allowNull: false,
			},
			direction: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			user_id: {
				type: Sequelize.UUID,
				allowNull: true,
				onDelete: "RESTRICT",
				references: {
					model: "users",
					key: "id",
					as: "user_id",
				},
			},
			status: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			credits: {
				type: Sequelize.INTEGER,
				allowNull: true,
			},
			deleted_at: {
				allowNull: true,
				type: Sequelize.DATE,
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
		await queryInterface.dropTable("conversations");
	},
};
