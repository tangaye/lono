"use strict";

module.exports = {
	up: async (queryInterface, Sequelize) => {
		/**
		 * Add altering commands here.
		 *
		 * Example:
		 * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
		 */
		await queryInterface.createTable("users", {
			id: {
				allowNull: false,
				primaryKey: true,
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
			},
			name: {
				type: Sequelize.STRING,
				allowNull: false,
				unique: true
			},
            credits: {
                type: Sequelize.DECIMAL,
                defaultValue: 0,
                allowNull: true
            },
            allow_overdraft: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false
            },
			api_key: {
				type: Sequelize.STRING,
				allowNull: false,
				unique: true
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
		await queryInterface.dropTable("users");
	},
};
