'use strict';

module.exports = {
	up: async (queryInterface, Sequelize) => {
		/**
		 * Add altering commands here.
		 *
		 * Example:
		 * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
		 */
		await queryInterface.createTable("message_parts", {
			id: {
				allowNull: false,
				primaryKey: true,
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
			},
			message_id: {
				type: Sequelize.UUID,
				allowNull: false,
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
				references: {
					model: "messages",
					key: "id",
					as: "message_id",
				},
			},
			part: {
				type: Sequelize.STRING(160),
				allowNull: false
			},
			credits: {
				type: Sequelize.INTEGER,
				defaultValue: 1,
				allowNull: false
			},
			status: {
				type: Sequelize.STRING,
				allowNull: false,
				defaultValue: "pending"
			},
			gateway_message_id: {
				type: Sequelize.STRING,
				allowNull: true,
				unique: true,
				comment: "Message id from sms gateway service.",
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
		await queryInterface.dropTable("message_parts");
	}
};
