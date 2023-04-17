const fs = require("fs");
const path = require("path");

module.exports = {
	development: {
		url: process.env.DB_URL,
		dialect: "postgres",
		dialectOptions: {
			bigNumberStrings: true,
		}
	},
    staging: {
		url: process.env.DB_URL,
		dialect: "postgres",
		dialectOptions: {
			bigNumberStrings: true,
		},
	},
	production: {
		url: process.env.DB_URL,
		dialect: "postgres",
		dialectOptions: {
			bigNumberStrings: true,
			ssl: {
				ca: fs.readFileSync(path.join(__dirname, "./", "ca-certificate.crt")),
			},
		},
	},
};
