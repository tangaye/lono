const database = require('../database/connection')
const QueryTypes = require("sequelize").QueryTypes
const logger = require("../logger")

/**
 * Returns 10 messages at a time that have been pending or failed for more than 30 minutes
 * function: findPendingFailedMessages()
 */
exports.findPendingFailedMessages = async () => {
    try {

        let messages = await database.query(`SELECT messages.id, senders.name as "sender.name", senders.id as "sender.id", recipient as to, message as body FROM messages INNER JOIN senders ON messages.sender_id = senders.id WHERE (status = 'pending' OR status = 'failed') AND (CURRENT_DATE >= messages.created_at::date) AND (CURRENT_TIME - INTERVAL '30 minutes' > messages.created_at::time) AND (retries IS NULL OR retries <> 1)LIMIT 10`, {
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