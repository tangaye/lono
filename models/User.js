const { DataTypes, Sequelize, Model } = require("sequelize");
const sequelize = require("../database/connection");

class User extends Model {}

User.init(
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
		role: {
			type: DataTypes.ENUM('admin', 'client'),
			allowNull: false,
			defaultValue: 'client'
		},
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				isEmail: true
			},
		},
        credits: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
			allowNull: true
        },
        allow_overdraft: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
			allowNull: false
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
		paranoid: true,
		deletedAt: 'deleted_at',
		underscored: true,
		modelName: "users",
		sequelize, // We need to pass the connection instance
	}
);

module.exports = User;
