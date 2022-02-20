const {DataTypes, Model} = require("sequelize")
const sequelize = require("../database/connection")

class MessagePart extends Model {}

MessagePart.init({
	id: {
		type: DataTypes.UUID,
		defaultValue: DataTypes.UUIDV4,
		allowNull: false,
		primaryKey: true,
	},
	part: {
		type: DataTypes.STRING(160),
		allowNull: false,
		validate: {
			notNull: {
				msg: "part is required",
			}
		},
	},
	status: {
		type: DataTypes.STRING,
		defaultValue: "pending",
	},
	credits: {
		type: DataTypes.INTEGER,
		defaultValue: 1,
		allowNull: true
	},
	gateway_message_id: {
		type: DataTypes.STRING,
		allowNull: true,
		unique: true,
	},
	message_id: {
		type: DataTypes.UUID,
		allowNull: false,
		validate: {
			notNull: {
				msg: "message_id is required",
			},
		},
	}
}, {
	paranoid: true,
	deletedAt: 'deleted_at',
	underscored: true,
	modelName: 'parts',
	tableName: "message_parts",
	sequelize, // We need to pass the connection instance
});

module.exports = MessagePart;