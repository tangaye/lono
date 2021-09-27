const Rollbar = require("rollbar");

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'
const isStaging = process.env.NODE_ENV === 'staging'

const ROLLBAR_CONFIG = {
    accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
    captureUncaught: true,
    captureUnhandledRejections: true
}

// only enable rollbar for staging and prod
if (isDevelopment) ROLLBAR_CONFIG.enabled = false;

exports.rollbar = new Rollbar(ROLLBAR_CONFIG)

exports.error = (message, err) => {
    try {
        return isStaging || isProduction ? this.rollbar.error(message, err) : console.error(message, err);
    } catch (error) {
        console.log("error with custom logger", error);
        console.log(message, err);
        return;
    }

}

exports.log = (message, data = {}) => {
    try {
        return isStaging || isProduction ? this.rollbar.info(message, data) : console.log(message, data);
    } catch (error) {
        console.log("error with custom log logger", error);
        console.log(message);
        return;
    }
}