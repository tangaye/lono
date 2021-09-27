const { DataTypes, Sequelize, Model } = require("sequelize");
const sequelize = require("../database/connection");

class Gateway extends Model {}

Gateway.init(
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
        slug: {
			type: DataTypes.STRING,
			unique: true,
			allowNull: false,
			validate: {
				notNull: {
					msg: "slug is required",
				},
			},
		},
		active: {
			type: DataTypes.BOOLEAN,
			allowNull: false
		},
	},
	{
		underscored: true,
		modelName: "gateways",
		sequelize, // We need to pass the connection instance
	}
);

module.exports = Gateway;
