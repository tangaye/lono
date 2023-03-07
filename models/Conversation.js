const { DataTypes, Sequelize, Model } = require("sequelize");
const sequelize = require("../database/connection");

class Conversation extends Model {}

Conversation.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: Sequelize.UUIDV4,
			allowNull: false,
			primaryKey: true,
		},
		from: {
			type: DataTypes.STRING(12),
			allowNull: false,
			validate: {
				notNull: {
					msg: "from is required",
				},
				len: {
					args: [1, 12],
					msg: "from should be 12 characters. ex: 213889998009",
				},
			},
		},
		to: {
			type: DataTypes.STRING(12),
			allowNull: false,
			validate: {
				notNull: {
					msg: "to is required",
				},
				len: {
					args: [1, 12],
					msg: "to should be 12 characters. ex: 213889998009",
				},
			},
		},
		message: {
			type: DataTypes.TEXT,
			allowNull: false,
			validate: {
				notNull: {
					msg: "message is required",
				},
			},
		},
		direction: {
			type: DataTypes.STRING(255),
			allowNull: false,
			validate: {
				notNull: {
					msg: "direction is required",
				},
			},
		},
		user_id: {
			type: DataTypes.UUID,
			allowNull: false,
			validate: {
				notNull: {
					msg: "user_id is required",
				},
			},
		},
		status: {
			type: DataTypes.STRING,
			defaultValue: "queued",
		},
		credits: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
	},
	{
		paranoid: true,
		deletedAt: "deleted_at",
		underscored: true,
		modelName: "conversations",
		tableName: "conversations",
		sequelize, // We need to pass the connection instance
	}
);

module.exports = Conversation;
