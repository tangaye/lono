const { DataTypes, Model, Sequelize } = require("sequelize");
const Contact = require("./Contact")
const sequelize = require("../database/connection");
const Msisdn = require("./Msisdn");

class ContactMsisdn extends Model {}

ContactMsisdn.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			allowNull: false,
			primaryKey: true
		},
		contact_id: {
			type: DataTypes.UUID,
			allowNull: false,
			validate: {
				notNull: {
					msg: "contact_id is required",
				},
			}
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
		paranoid: true,
		deletedAt: 'deleted_at',
		underscored: true,
		tableName: "contact_msisdns",
		sequelize, // We need to pass the connection instance
	}
);

module.exports = ContactMsisdn;
