const database = require('../database/connection')
const QueryTypes = require("sequelize").QueryTypes
const logger = require("../logger")

/**
 * Returns 10 messages at a time that have been pending or failed for more than 30 minutes
 * function: findPendingFailedMessages()
 */
exports.findPendingFailedMessages = async () => {
    try {

        // AND (retries IS NULL OR retries <> 1)
        let messages = await database.query(`SELECT messages.id, senders.name as "sender.name", senders.id as "sender.id", recipient as to, message as body FROM messages INNER JOIN senders ON messages.sender_id = senders.id WHERE (status = 'pending' OR status = 'failed') AND (CURRENT_DATE >= messages.created_at::date)
        AND (sender_id = '') LIMIT 20`, {
            nest: true,
            type: QueryTypes.SELECT
        })

        if (messages) return messages
        return []
    } catch (error) {
        logger.log('findPendingFailedMessages: ', error)
        return []
    }
}

exports.citiMay = async () => {
    try {

        const sql = `
            select messages.id, message, msisdn_id, sender_id, user_id, gateway_id, created_at
            from messages
            WHERE messages.created_at::date between '2022-04-28' and '2022-05-2'
              and messages.id not in (select message_id from message_parts)
            ORDER BY messages.created_at DESC
            LIMIT 1
        `
        // AND (retries IS NULL OR retries <> 1)
        const messages = await database.query(sql, {
            nest: true,
            type: QueryTypes.SELECT
        })

        if (messages) return messages
        return []
    } catch (error) {
        logger.log('citiMay: ', error)
        return []
    }
}

exports.failedMessagesToRetry = async () => {
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
        // AND (retries IS NULL OR retries <> 1)
        const messages = await database.query(sql, {
            nest: true,
            type: QueryTypes.SELECT
        })

        if (messages) return messages
        return []
    } catch (error) {
        logger.log('failedMessagesToRetry: ', error)
        return []
    }
}