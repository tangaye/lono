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
				type: Sequelize.STRING,
				allowNull: false
			},
			message: {
				type: Sequelize.TEXT,
				allowNull: false
			},
			sender_id: {
				type: Sequelize.UUID,
				allowNull: false,
				onDelete: "RESTRICT",
				references: {
					model: "senders",
					key: "id",
					as: "sender_id",
				},
			},
            gateway_id: {
				type: Sequelize.UUID,
				allowNull: false,
				onDelete: "RESTRICT",
				references: {
					model: "gateways",
					key: "id",
					as: "gateway_id",
				},
			},
			ext_message_id: {
				type: Sequelize.STRING,
				allowNull: true,
				comment: "external message id from user's app",
			},
			gateway_message_id: {
				type: Sequelize.STRING,
				allowNull: true,
				unique: true,
				comment: "Message id from sms gateway service.",
			},
			status: {
				type: Sequelize.STRING,
				allowNull: false
			},
            cost: {
                type: Sequelize.DECIMAL,
				allowNull: true
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
		await queryInterface.dropTable("messages")
	},
};