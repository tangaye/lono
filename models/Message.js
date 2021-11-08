const {
	DataTypes,
	Sequelize,
	Model
} = require("sequelize");
const sequelize = require("../database/connection");

class Message extends Model {}

Message.init({
	id: {
		type: DataTypes.UUID,
		defaultValue: Sequelize.UUIDV4,
		allowNull: false,
		primaryKey: true,
	},
	recipient: {
		type: DataTypes.STRING(12),
		allowNull: false,
		validate: {
			notNull: {
				msg: "recipient number is required",
			},
            len: {
                args: [1, 12],
                msg: "recipient number should be 12 characters. ex: 213889998009"
            }
		},
	},
	message: {
		type: DataTypes.TEXT,
		allowNull: false,
		validate: {
			notNull: {
				msg: "message is required",
			}
		},
	},
	sender_id: {
		type: DataTypes.UUID,
		allowNull: false,
		validate: {
			notNull: {
				msg: "sender is required",
			},
		},
	},
	ext_message_id: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	gateway_message_id: {
		type: DataTypes.STRING,
		allowNull: true,
		unique: true,
	},
    gateway_id: {
        type: Sequelize.UUID,
        allowNull: false
    },
	status: {
		type: DataTypes.STRING,
		defaultValue: "pending",
	},
    cost: {
		type: DataTypes.INTEGER,
        allowNull: true
	},
    alt_gateway_id: {
        type: Sequelize.UUID,
        allowNull: true
    },
    alt_gateway_message_id: {
		type: DataTypes.STRING,
		allowNull: true,
		unique: true,
	},
    retries: {
		type: DataTypes.INTEGER,
		allowNull: true
	}
}, {
    paranoid: true,
    deletedAt: 'deleted_at',
	underscored: true,
	modelName: "messages",
	sequelize, // We need to pass the connection instance
});

module.exports = Message;