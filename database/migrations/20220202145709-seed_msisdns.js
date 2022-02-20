'use strict';
const {QueryTypes} = require('sequelize')
const database = require('../connection')
const Msisdn = require('../../models/Msisdn')

module.exports = {
	up: async (queryInterface, Sequelize) => {
		/**
		 * Add altering commands here.
		 *
		 * Example:
		 * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
		 */


		const recipients = await database.query("SELECT DISTINCT recipient FROM messages", {type: QueryTypes.SELECT})

		if (recipients) {

			for (const item of recipients) {

				await Msisdn.findOrCreate({
					where: { id: item.recipient },
					defaults: {
						id: item.recipient
					}
				})
			}

		}
	},

	down: async (queryInterface, Sequelize) => {
		/**
		 * Add reverting commands here.
		 *
		 * Example:
		 * await queryInterface.dropTable('users');
		 */
	}
};
