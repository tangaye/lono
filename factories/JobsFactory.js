const database = require('../database/connection')
const QueryTypes = require("sequelize").QueryTypes
const logger = require("../logger")
const Sender = require("../models/Sender");
const User = require("../models/User");
const Gateway = require("../models/Gateway");

/**
 * Returns messages not added to queue or stored in the messages_parts table
 * since the 11 of May 2022
 * @return {Promise<*[]|*>}
 */
exports.messageNotAddedToQueue = async () => {
    try {

        const sql = `
            select messages.id, message, msisdn_id, sender_id, user_id, gateway_id, created_at
            from messages
            WHERE messages.created_at::date between '2022-05-11' and current_date
              and messages.id not in (select message_id from message_parts)
            ORDER BY messages.created_at DESC
            LIMIT 1
        `
        const result = await makeQuery(sql)
        const payload = await preparePayload(result)
        if (payload) return payload

        return null

    } catch (error) {
        logger.log('messageNotAddedToQueue: ', error)
        return null
    }
}

/**
 * Returns Messages that have failed to since the 6th of May 2022 to retry
 * @return {Promise<*[]|*>}
 */
exports.failedMessageToRetry = async () => {

    try {

        const sql = `
            select messages.id,
                   message,
                   sender_id,
                   msisdn_id,
                   mp.status,
                   sender_id,
                   user_id,
                   gateway_id,
                   mp.created_at
            from messages
            inner join message_parts mp on messages.id = mp.message_id
            where mp.status = 'failed' and messages.retries IS NULL and mp.created_at::date between '2022-05-06' and current_date
            ORDER BY messages.created_at DESC
            LIMIT 1
        `

        const result = await makeQuery(sql)
        const payload = await preparePayload(result)
        if (payload) return payload

        return null

    } catch (error) {
        logger.log('failedMessageToRetry: ', error)
        return null
    }
}

/**
 * Make sql query
 * @param sql
 * @return {Promise<null|*>}
 */
const makeQuery = async sql => {
    try {

        const result = await database.query(sql, {
            nest: true,
            type: QueryTypes.SELECT
        })

        if (result && result[0]) return result[0]

        return null
    }
    catch (error) {
        logger.log('makeQuery: ', error)
        return null
    }
}

/**
 * Prepare payload
 * @param message
 * @return {Promise<null|{sender, message_id, to: *, body, user: Model<any, TModelAttributes>, gateway: Model<any, TModelAttributes>}>}
 */
const preparePayload = async message => {
    try {

        if (message) {

            const sender = await Sender.findByPk(message.sender_id)
            const user = await User.findByPk(message.user_id)
            const gateway = await Gateway.findByPk(message.gateway_id)

            return {
                message_id: message.id,
                to: message.msisdn_id,
                body: message.message,
                gateway: {id: gateway.id, slug: gateway.slug},
                user_id: user.id,
                sender: sender.name
            }
        }
        return null
    }
    catch (error)
    {
        logger.log('preparePayload: ', error)
        return null
    }
}