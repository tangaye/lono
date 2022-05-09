const path = require("path")
require("dotenv").config({path: path.join(__dirname, "./.env")})
const express = require("express")
const helmet = require("helmet")
const cors = require("cors")
const app = express()
const Queue = require("./Queue")
const constants = require("./constants")
const database = require("./database/connection")
const logger = require('./logger')
const PORT = process.env.PORT || 8080

const User = require("./models/User")
const Msisdn = require("./models/Msisdn")
const Contact = require("./models/Contact")
const Message = require("./models/Message")
const Sender = require("./models/Sender")
const Group = require("./models/Group")
const MessagePart = require("./models/MessagePart")
const ContactGroup = require("./models/ContactGroup")
const ContactMsisdnUser = require("./models/ContactMsisdnUser")

const docRoutes = require("./routes/api.docs.route")
const messagesRoutes = require("./routes/messages")
const userRoutes = require("./routes/users")
const contactRoutes = require("./routes/contacts")
const groupRoutes = require("./routes/groups")
const helper = require("./helpers");

// app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, "public")))

// routes setup
app.use(docRoutes)
app.use("/api/v1/", messagesRoutes)
app.use("/api/v1/", userRoutes)
app.use("/api/v1/", contactRoutes)
app.use("/api/v1/", groupRoutes)

// tables associations
User.hasMany(Sender);
Sender.belongsTo(User);
Message.belongsTo(Sender);
Sender.hasMany(Message);
Contact.belongsToMany(User, {through: ContactMsisdnUser})
User.belongsToMany(Contact, {through: ContactMsisdnUser})
Msisdn.belongsToMany(Contact, {through: ContactMsisdnUser})
Contact.belongsToMany(Msisdn, {through: ContactMsisdnUser})
User.hasMany(Message)
Message.belongsTo(User)
Group.belongsToMany(Contact, {through: ContactGroup})
Contact.belongsToMany(Group, {through: ContactGroup})
Message.hasMany(MessagePart)
MessagePart.belongsTo(Message)

//404 middleware, should be below routes
app.use((request, response, next) =>
	response.status(constants.NOTFOUND).send({
		errorCode: constants.FAILURE_CODE,
		errorMessage: `${request.originalUrl} not found`,
	})
)

// 500 middleware
app.use((error, request, response, next) => {
	console.error(error.stack)
	return response.status(constants.SERVER_ERROR).send({
		errorCode: constants.FAILURE_CODE,
		errorMessage: "An unexpected error occured.",
	})
});


(async () => {

	try {

		helper.checkEnvVariables()

        await Promise.all([
			database.authenticate(),
			Queue.createQueue(constants.BULKGATE_MESSAGES_QUEUE),
			Queue.createQueue(constants.TWILIO_MESSAGES_QUEUE),
			Queue.createQueue(constants.BULKGATE_MESSAGES_RETRY_QUEUE)
		])

		app.listen(PORT, () => logger.log(`app listening on localhost:${PORT}`))

		require("./workers/BulkgateWorker").start()
		require("./workers/TwilioWorker").start()
		require("./workers/BulkgateRetryWorker").start()

		require("./jobs/citimay").start()

		logger.log("database connection has been established successfully.")

	} catch (error) {

        logger.log("error starting app: ", error)
	}

})()