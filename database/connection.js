const sequelize = require("sequelize");
const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, "../.env"),
});

const environment = process.env.NODE_ENV;
const config = require("./config")[environment];

const database = new sequelize(config.url,
	{
		dialect: config.dialect,
		pool: {
			max: 2,
			min: 0,
			acquire: 30000,
			idle: 10000,
		},
		define: {
			underscored: true,
			underscoredAll: true,
			createdAt: "created_at",
			updatedAt: "updated_at",
		},
		dialectOptions: config.dialectOptions,
		logging: environment === "production",
	}
);

module.exports = database;
