"use strict";

module.exports = {
	up: async (queryInterface, Sequelize) => {
		/**
		 * Add altering commands here.
		 *
		 * Example:
		 * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
		 */
		await queryInterface.createTable("messages", {
			id: {
				allowNull: false,
				primaryKey: true,
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
			},
			recipient: {
				type: Sequelize.STRING(10),
				allowNull: false,
				notNull: {
					msg: "recipient is required",
				},
			},
			message: {
				type: Sequelize.STRING(160),
				allowNull: false,
				notNull: {
					msg: "message is required",
				},
			},
			sender_id: {
				type: Sequelize.UUID,
				allowNull: false,
				notNull: {
					msg: "sender_id is required",
				},
				onDelete: "RESTRICT",
				references: {
					model: "senders",
					key: "id",
					as: "sender_id",
				},
			},
			ext_message_id: {
				type: Sequelize.STRING,
				allowNull: true,
				comment: "external message id for client's app",
			},
			status: {
				type: Sequelize.STRING,
				defaultValue: "pending",
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
		await queryInterface.dropTable("messages");
	},
};
