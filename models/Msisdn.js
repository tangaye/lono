const {DataTypes, Model} = require("sequelize")
const sequelize = require("../database/connection")

class Msisdn extends Model {}

Msisdn.init({
	id: {
		type: DataTypes.STRING(12),
		allowNull: false,
		primaryKey: true,
		validate: {
			notNull: {
				msg: "msisdn is required",
			},
			len: {
				args: [1, 12],
				msg: "msisdn should be 12 characters. ex: 213889998009"
			}
		}
	}
}, {
	paranoid: true,
	deletedAt: 'deleted_at',
	underscored: true,
	tableName: "msisdns",
	sequelize, // We need to pass the connection instance
});

module.exports = Msisdn;