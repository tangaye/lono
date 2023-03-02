const axios = require("axios")

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
            logger.log("Error sending message to mattermost: ", error.response.data.requestError)
        }
    }
}

module.exports = Mattermost