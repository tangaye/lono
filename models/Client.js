const { DataTypes, Sequelize, Model } = require("sequelize");
const sequelize = require("../database/connection");

class Client extends Model {}

Client.init(
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
		api_key: {
			type: DataTypes.STRING,
			unique: true,
			allowNull: false,
			validate: {
				notNull: {
					msg: "api_key is required",
				},
			},
		},
	},
	{
		underscored: true,
		modelName: "clients",
		sequelize, // We need to pass the connection instance
	}
);

module.exports = Client;
