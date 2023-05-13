const { DataTypes, Sequelize, Model } = require("sequelize");
const sequelize = require("../database/connection");

class Carrier extends Model {}

Carrier.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: Sequelize.UUIDV4,
			allowNull: false,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
			unique: true,
			allowNull: false,
			validate: {
				notNull: {
					msg: "name is required",
				},
			},
		},
        msisdn_prefix: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: false,
        },
	},
	{
		paranoid: true,
		deletedAt: 'deleted_at',
		underscored: true,
		tableName: "carriers",
		sequelize, // We need to pass the connection instance
	}
);

module.exports = Carrier;
