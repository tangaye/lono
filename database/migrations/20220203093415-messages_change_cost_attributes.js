'use strict';

module.exports = {
	  up: async (queryInterface, Sequelize) => {
			/**
			 * Add altering commands here.
			 *
			 * Example:
			 * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
			 */

			// change recipient type
			await queryInterface.changeColumn("messages", "cost", {
			  type: Sequelize.INTEGER,
			  allowNull: false,
			})
	  },

	  down: async (queryInterface, Sequelize) => {
			/**
			 * Add reverting commands here.
			 *
			 * Example:
			 * await queryInterface.dropTable('users');
			 */

			await queryInterface.changeColumn("messages", "cost", {
			  type: Sequelize.DECIMAL,
			  allowNull: true
			})
	  }
};
