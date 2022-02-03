const {DataTypes, Model} = require("sequelize")
const sequelize = require("../database/connection")

class Group extends Model {}

Group.init({
	id: {
		type: DataTypes.UUID,
		defaultValue: Sequelize.UUIDV4,
		allowNull: false,
		primaryKey: true,
	},
	name: {
		type: DataTypes.STRING,
		allowNull: false,
		validate: {
			notNull: {
				msg: "name is required",
			}
		},
	},
	description: {
		type: DataTypes.TEXT,
		allowNull: true
	},
	user_id: {
		type: DataTypes.UUID,
		allowNull: false,
		validate: {
			notNull: {
				msg: "user_id is required",
			},
		},
	}
}, {
	paranoid: true,
	deletedAt: 'deleted_at',
	indexes: [{ unique: true, fields: ['name', 'user_id'] }],
	underscored: true,
	tableName: "groups",
	sequelize, // We need to pass the connection instance
});

module.exports = Group;