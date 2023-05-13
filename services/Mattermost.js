const axios = require("axios")
const logger = require("../logger")

class Mattermost
{

    constructor ()
    {
        this.baseUrl = process.env.MATTERMOST_WEBHOOK
    }

    async sendMessage(message)
    {
        try
        {
            const data = {text: message}

            await axios.post(this.baseUrl, data)


        } catch (error)
        {
            logger.log("Error sending message to mattermost: ", error)
        }
    }
}

module.exports = Mattermost