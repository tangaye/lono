const { DataTypes, Model } = require("sequelize");
const sequelize = require("../database/connection");

class ContactGroup extends Model {}

ContactGroup.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: Sequelize.UUIDV4,
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
		group_id: {
			type: DataTypes.UUID,
			allowNull: false,
			validate: {
				notNull: {
					msg: "group_id is required",
				},
			},
		},
	},
	{
		paranoid: true,
		deletedAt: 'deleted_at',
		underscored: true,
		tableName: "contact_groups",
		sequelize, // We need to pass the connection instance
	}
);

module.exports = ContactGroup;
