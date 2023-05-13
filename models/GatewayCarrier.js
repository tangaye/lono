const { DataTypes, Model } = require("sequelize");
const sequelize = require("../database/connection");

class GatewayCarrier extends Model {}

GatewayCarrier.init(
	{
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
		gateway_id: {
			type: DataTypes.UUID,
			primaryKey: true,
			allowNull: false,
			validate: {
				notNull: {
					msg: "gateway_id is required",
				},
			},
		},
		carrier_id: {
			type: DataTypes.UUID,
			primaryKey: true,
			allowNull: false,
			validate: {
				notNull: {
					msg: "carrier_id is required",
				},
			},
		}
	},
	{
		underscored: true,
		paranoid: true,
		deletedAt: 'deleted_at',
		tableName: 'gateway_carrier',
		sequelize, // We need to pass the connection instance
	}
);

module.exports = GatewayCarrier;
