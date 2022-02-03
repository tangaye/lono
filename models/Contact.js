const {DataTypes, Model} = require("sequelize")
const sequelize = require("../database/connection")

class Contact extends Model {}

Contact.init({
	id: {
		type: DataTypes.UUID,
		defaultValue: Sequelize.UUIDV4,
		allowNull: false,
		primaryKey: true,
	},
	first_name: {
		type: DataTypes.STRING,
		allowNull: true
	},
	middle_name: {
		type: DataTypes.STRING,
		allowNull: true
	},
	last_name: {
		type: DataTypes.STRING,
		allowNull: true
	},
	metadata: {
		type: DataTypes.JSONB,
		allowNull: true
	}
}, {
	paranoid: true,
	deletedAt: 'deleted_at',
	underscored: true,
	modelName: "contact",
	tableName: "contacts",
	sequelize, // We need to pass the connection instance
});

module.exports = Contact;