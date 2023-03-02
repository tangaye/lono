const axios = require("axios")
const logger = require("../logger")
const querystring = require("querystring")

class Orange
{
    
    constructor()
    {
        this.baseUrl = process.env.ORANGE_BASEURL
        this.devPhoneNumber = process.env.ORANGE_DEV_PHONE_NUMBER
        this.authorizationHeader = process.env.ORANGE_AUTHORIZATION_HEADER
    }

    getTokenUrl()
    {
        return `${this.baseUrl}/oauth/v3/token`
    }

    getSendUrl()
    {
        return `${this.baseUrl}/smsmessaging/v1/outbound/tel%3A%2B${this.devPhoneNumber}/requests`
    }

    async getToken()
    {
        try {

            const data = querystring.stringify({"grant_type": "client_credentials"})
            const result = await axios.post(this.getTokenUrl(), data, {
                headers: {
                    "Authorization": `Basic ${this.authorizationHeader}`
                }
            })

            if (result?.data) return result.data?.access_token
            
        } catch (error) {
           
            logger.error("Error getting token for orange gateway: ", {error})
        }
    }

    /**
     * 
     * @param {string} recipient 
     * @param {string} message 
     * @param {string} senderName
     */
    async send(recipient, message, senderName)
    {
        try {
            
            const token = await this.getToken()

            if (token) {

                const result = await axios.post(this.getSendUrl(), {
                    "outboundSMSMessageRequest": {
                        "address": `tel:+${recipient}`,
                        "senderAddress": `tel:+${this.devPhoneNumber}`,
                        "senderName": `${senderName}`,
                        "outboundSMSTextMessage": {
                            "message": `${message}`
                        }
                    }
                }, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                })
    
                if (result.data) {
                    const resource_url = result.data.outboundSMSMessageRequest.resourceURL
                    const id = resource_url.split("/").pop()

                    console.log("resource url array: ", resource_url.split("/"))
                    console.log("resource url id: ", id)
                    return {id}
                }

            }

            
        } catch (error) {
            
            logger.error("Error sending message from orange gateway: ", error.response.data.requestError)
        }
    }

    async getBalance ()
    {
        try
        {
            const token = await this.getToken()

            if (token) {

                const result = await axios.get(`${this.baseUrl}/sms/admin/v1/contracts`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                })
    
                if (result.data) {

                    const data = result.data[0]
                    const credits = data.availableUnits

                    const expiryDate = new Intl.DateTimeFormat("default", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric"
                    }).format(new Date(data.expirationDate))

                    return {credits, expiryDate}
                }
            }
        }
        catch(error)
        {
            logger.error("Error checking balance: ", error.response.data.requestError)
        }
    }

}

module.exports = Orange