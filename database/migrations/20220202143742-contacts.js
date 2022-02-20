'use strict';

module.exports = {
	up: async (queryInterface, Sequelize) => {
		/**
		 * Add altering commands here.
		 *
		 * Example:
		 * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
		 */
		await queryInterface.createTable("contacts", {
			id: {
				allowNull: false,
				primaryKey: true,
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
			},
			first_name: {
				type: Sequelize.STRING,
				allowNull: true
			},
			middle_name: {
				type: Sequelize.STRING,
				allowNull: true
			},
			last_name: {
				type: Sequelize.STRING,
				allowNull: true
			},
			metadata: {
				type: Sequelize.JSONB,
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
		await queryInterface.dropTable("contacts");
	}
};
