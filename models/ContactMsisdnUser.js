const { DataTypes, Model } = require("sequelize");
const sequelize = require("../database/connection");

class ContactMsisdnUser extends Model {}

ContactMsisdnUser.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			allowNull: false,
			primaryKey: true,
		},
		contact_id: {
			type: DataTypes.UUID,
			allowNull: false,
			validate: {
				notNull: {
					msg: "contact_id is required",
				},
			},
		},
		msisdn_id: {
			type: DataTypes.UUID,
			allowNull: false,
			validate: {
				notNull: {
					msg: "msisdn_id is required",
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
		}
	},
	{
		underscored: true,
		paranoid: true,
		deletedAt: 'deleted_at',
		tableName: 'contact_msisdns_users',
		indexes: [{ unique: true, fields: ['contact_id', 'msisdn_id', 'user_id'] }],
		sequelize, // We need to pass the connection instance
	}
);

module.exports = ContactMsisdnUser;
