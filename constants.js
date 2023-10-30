exports.SUCCESS_CODE = 0;
exports.FAILURE_CODE = 1;
exports.UNAUTHORIZED = 403;
exports.SERVER_ERROR = 500;
exports.INVALID_DATA = -1200;
exports.NOTFOUND = 404;
exports.MESSAGES_QUEUE = "messagequeue";
exports.TWILIO_GATEWAY = "twilio";
exports.BULKGATE_GATEWAY = "bulkgate";
exports.SMS_TARIFF = 1;
exports.PENDING_STATUS = "pending";
exports.FAILED_STATUS = "failed";
exports.DELIVERED_STATUS = "delivered";
exports.QUEUED_STATUS = "delivered";
exports.MESSAGES_ATTRIBUTES = [
	["id", "smsId"],
	["msisdn_id", "recipient"],
	"message",
	["ext_message_id", "extMessageId"],
	"status",
	["credits", "cost"],
	["created_at", "date"],
];

exports.TWILIO_MESSAGES_QUEUE = "twilio_messages_queue";
exports.ORANGE_MESSAGES_QUEUE = "orange_messages_queue";
exports.BULKGATE_MESSAGES_QUEUE = "bulkgate_messages_queue";
exports.DSEVEN_MESSAGES_QUEUE = "dseven_messages_queue";
exports.ADMIN_ROLE = "admin";
exports.CLIENT_ROLE = "client";

/**Required environment variables */
exports.REQUIRED_ENV_VARIABLES = [
	"DB_URL",
	"NODE_ENV",
	"REDIS_URL",
	"CONVERSATION_BUSINESS_NUMBER",
    "MATTERMOST_WEBHOOK",
    "DSEVEN_BASEURL",
    "DSEVEN_TOKEN",
    "ORANGE_BASEURL",
    "ORANGE_AUTHORIZATION_HEADER",
    "ORANGE_DEV_PHONE_NUMBER",
    "MTN_SMPP_URL",
    "MTN_SMPP_SYSTEM_ID",
    "MTN_SMPP_PASSWORD"
];

/**Environment variables needed but not required to run the app*/
exports.ENV_VARIABLES = [
	"PORT",
	"TWILIO_ACCOUNT_SID",
	"TWILIO_AUTH_TOKEN",
	"BULKGATE_APP_ID",
	"BULKGATE_APP_TOKEN",
	"BULKGATE_BASEURL",
	"ROLLBAR_ACCESS_TOKEN",
	"KC_ADMIN_CLIENT_SECRET",
	"KC_ADMIN_CLIENT_ID",
	"KC_REALM",
	"KC_SERVER_URL",
];

exports.PORT = process.env.PORT || 8080;
