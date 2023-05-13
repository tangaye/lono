const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "./.env") });
const Rollbar = require("rollbar");

const isDevelopment = process.env.NODE_ENV === 'development'

exports.error = (message, err) => {

    try {

        if (isDevelopment) {

            if (err?.response) {
                console.error(message, err.response?.data)
            } else {
                console.error(message, err)
            }
        }
        else {

            const rollbar = new Rollbar({
                accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
                captureUncaught: true,
                captureUnhandledRejections: true,
                enabled: true
            })

            if (err?.response) {
                rollbar.error(message, err.response?.data)

            } else {
                rollbar.error(message, err)
            }
        }

    } catch (error) {
        console.log("error with custom logger", error);
    }

}

exports.log = (message, data = {}) => {
    try {
        console.log(message, data)
    } catch (error) {
        console.log("error with custom log logger", error);
    }
}