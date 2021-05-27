const { DataTypes, Sequelize, Model } = require("sequelize");
const sequelize = require("../database/connection");

class Message extends Model {}

Message.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: Sequelize.UUIDV4,
			allowNull: false,
			primaryKey: true,
		},
		recipient: {
			type: DataTypes.STRING(10),
			allowNull: false,
			validate: {
				notNull: {
					msg: "recipient is required",
				},
			},
		},
		message: {
			type: DataTypes.STRING(160),
			allowNull: false,
			validate: {
				notNull: {
					msg: "message is required",
				},
			},
		},
		sender_id: {
			type: DataTypes.UUID,
			allowNull: false,
			validate: {
				notNull: {
					msg: "sender_id is required",
				},
			},
		},
		ext_message_id: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		status: {
			type: DataTypes.STRING,
			defaultValue: "pending",
		},
	},
	{
		underscored: true,
		modelName: "messages",
		sequelize, // We need to pass the connection instance
	}
);

module.exports = Message;
