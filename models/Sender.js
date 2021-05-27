const { DataTypes, Sequelize, Model } = require("sequelize");
const sequelize = require("../database/connection");

class Sender extends Model {}

Sender.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: Sequelize.UUIDV4,
			allowNull: false,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING(11),
			unique: true,
			allowNull: false,
			validate: {
				notNull: {
					msg: "name is required",
				},
			},
		},
		client_id: {
			type: DataTypes.UUID,
			allowNull: false,
			validate: {
				notNull: {
					msg: "client_id is required",
				},
			},
		},
	},
	{
		underscored: true,
		modelName: "senders",
		sequelize, // We need to pass the connection instance
	}
);

module.exports = Sender;
