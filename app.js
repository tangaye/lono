const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const app = express();
const jobs = require("./Jobs");
const Queue = require("./Queue");
const logger = require("./logger");
const helper = require("./helpers");
const constants = require("./constants");
const database = require("./database/connection");
require("dotenv").config({ path: path.join(__dirname, "./.env") });

const User = require("./models/User");
const Group = require("./models/Group");
const Msisdn = require("./models/Msisdn");
const Sender = require("./models/Sender");
const Contact = require("./models/Contact");
const Message = require("./models/Message");
const MessagePart = require("./models/MessagePart");
const Conversation = require("./models/Conversation");
const ContactGroup = require("./models/ContactGroup");
const ContactMsisdnUser = require("./models/ContactMsisdnUser");

const docRoutes = require("./routes/api.docs.route");
const messagesRoutes = require("./routes/messages");
const userRoutes = require("./routes/users");
const contactRoutes = require("./routes/contacts");
const groupRoutes = require("./routes/groups");
const conversationRoutes = require("./routes/conversations");

// app.use(helmet())
app.use(cors());
app.use(express.json({
    limit: "200mb",
    verify : (req, res, buf, encoding) => {
        try {
            JSON.parse(buf)
        } catch(e) {

            res.status(404).send({
                errorCode: constants.FAILURE_CODE,
                errorMessage: `Invalid data`,
            })
            logger.log("invalid JSON passed to API")
            throw Error('invalid JSON');
        }
    }
}));
app.use(express.urlencoded({ extended: true, limit: "200mb" }));
app.use(express.static(path.join(__dirname, "public")));

// routes setup
app.use(docRoutes);
app.use("/api/v1/", messagesRoutes);
app.use("/api/v1/", userRoutes);
app.use("/api/v1/", contactRoutes);
app.use("/api/v1/", groupRoutes);
app.use("/api/v1", conversationRoutes);


//404 middleware, should be below routes
app.use((request, response, next) =>
	response.status(constants.NOTFOUND).send({
		errorCode: constants.FAILURE_CODE,
		errorMessage: `${request.originalUrl} not found`,
	})
);

// 500 middleware
app.use((error, request, response, next) => {
	console.error(error.stack);
	return response.status(constants.SERVER_ERROR).send({
		errorCode: constants.FAILURE_CODE,
		errorMessage: "An unexpected error occured.",
	});
});

// tables associations
User.hasMany(Sender);
Sender.belongsTo(User);
Message.belongsTo(Sender);
Sender.hasMany(Message);
Contact.belongsToMany(User, { through: ContactMsisdnUser });
User.belongsToMany(Contact, { through: ContactMsisdnUser });
Msisdn.belongsToMany(Contact, { through: ContactMsisdnUser });
Contact.belongsToMany(Msisdn, { through: ContactMsisdnUser });
User.hasMany(Message);
Message.belongsTo(User);
Group.belongsToMany(Contact, { through: ContactGroup });
Contact.belongsToMany(Group, { through: ContactGroup });
Message.hasMany(MessagePart);
MessagePart.belongsTo(Message);
Conversation.belongsTo(User);
User.hasMany(Conversation);


(async () => {
	try {
		// check if envs are set
		helper.checkEnvVariables();

		// setup app on port
		app.listen(constants.PORT, () =>
			logger.log(`Running on port ${constants.PORT}`)
		);

		// connect to db
		await database.authenticate();

		// setup queues
		Queue.createQueue(constants.ORANGE_MESSAGES_QUEUE);
		Queue.createQueue(constants.TWILIO_MESSAGES_QUEUE);
		Queue.createQueue(constants.BULKGATE_MESSAGES_QUEUE);
		Queue.createQueue(constants.TWILIO_MESSAGES_RETRY_QUEUE);
		Queue.createQueue(constants.BULKGATE_MESSAGES_RETRY_QUEUE);

		require("./workers/OrangeWorker").start();
		require("./workers/BulkgateWorker").start();
		require("./workers/TwilioWorker").start();
		require("./workers/BulkgateRetryWorker").start();

		await jobs.startAll();

		console.log("database connection has been established successfully.");
	} catch (error) {
		logger.log("error starting app: ", error);
	}
})();
