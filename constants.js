exports.SUCCESS_CODE = 0
exports.FAILURE_CODE = 1
exports.UNAUTHORIZED = 403
exports.SERVER_ERROR = 500
exports.NOTFOUND = 404
exports.MESSAGES_QUEUE = "messagequeue"
exports.TWILIO_GATEWAY = "twilio"
exports.BULKGATE_GATEWAY = "bulkgate"
exports.SMS_TARIFF = 1
exports.PENDING_STATUS = 'pending'
exports.FAILED_STATUS = 'failed'
exports.DELIVERED_STATUS = 'delivered'
exports.MESSAGES_ATTRIBUTES = [
	["id", "smsId"],
	"recipient",
	"message",
	["ext_message_id", "extMessageId"],
	"status",
	"cost",
	["created_at", "date"],
]
