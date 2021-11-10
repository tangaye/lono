const database = require('../database/connection')
const QueryTypes = require("sequelize").QueryTypes
const logger = require("../logger")

/**
 * Returns 10 messages at a time that have been pending or failed for more than 30 minutes
 * function: findPendingFailedMessages()
 */
exports.findPendingFailedMessages = async () => {
    try {

        let messages = await database.query(`SELECT messages.id, senders.name as "sender.name", senders.id as "sender.id", recipient as to, message as body FROM messages INNER JOIN senders ON messages.sender_id = senders.id WHERE (status = 'pending' OR status = 'failed') AND (CURRENT_DATE >= messages.created_at::date)
        AND (sender_id = '247a3182-743c-4a55-abff-cbe3e380b8cd') LIMIT 20`, {
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