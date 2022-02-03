const Rollbar = require("rollbar");

const isDevelopment = process.env.NODE_ENV === 'development'

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
        if (err?.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            this.rollbar.error(message, err.response?.data)
            console.error(message, err.response?.data)

        } else {
            this.rollbar.error(message, err)
            console.error(message, err)
        }

    } catch (error) {
        console.log("error with custom logger", error);
        console.log(message, err);
    }

}

exports.log = (message, data = {}) => {
    try {
        console.log(message, data)
    } catch (error) {
        console.log("error with custom log logger", error);
        console.log(message);
    }
}