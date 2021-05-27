const fs = require("fs");
const path = require("path");

module.exports = {
	development: {
		username: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		host: process.env.DB_HOSTNAME,
		port: process.env.DB_PORT,
		dialect: "postgres",
		dialectOptions: {
			bigNumberStrings: true,
		},
	},
	production: {
		username: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		host: process.env.DB_HOSTNAME,
		port: process.env.DB_PORT,
		dialect: "postgres",
		dialectOptions: {
			bigNumberStrings: true,
			ssl: {
				ca: fs.readFileSync(path.join(__dirname, "./", "ca-certificate.crt")),
			},
		},
	},
};
