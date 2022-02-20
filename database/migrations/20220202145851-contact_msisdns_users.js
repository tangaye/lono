'use strict';

module.exports = {
	up: async (queryInterface, Sequelize) => {
		/**
		 * Add altering commands here.
		 *
		 * Example:
		 * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
		 */
		await queryInterface.createTable("contact_msisdns_users", {
			contact_id: {
				type: Sequelize.UUID,
				primaryKey: true,
				allowNull: false,
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
				references: {
					model: "contacts",
					key: "id",
					as: "contact_id",
				},
			},
			msisdn_id: {
				type: Sequelize.STRING(12),
				primaryKey: true,
				allowNull: true,
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
				references: {
					model: "msisdns",
					key: "id",
					as: "msisdn_id",
				},
			},
			user_id: {
				type: Sequelize.UUID,
				primaryKey: true,
				allowNull: false,
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
				references: {
					model: "users",
					key: "id",
					as: "user_id",
				},
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
		})
	},

	down: async (queryInterface, Sequelize) => {
		/**
		 * Add reverting commands here.
		 *
		 * Example:
		 * await queryInterface.dropTable('users');
		 */
		await queryInterface.dropTable("contact_msisdns_users");
	}
};
