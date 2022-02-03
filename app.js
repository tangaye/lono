const path = require("path")
require("dotenv").config({path: path.join(__dirname, "./.env")})
const express = require("express")
const helmet = require("helmet")
const cors = require("cors")
const app = express()
const Queue = require("./services/Queue")
const {NOTFOUND, SERVER_ERROR, FAILURE_CODE, MESSAGES_QUEUE} = require("./constants")
const database = require("./database/connection")
const logger = require('./logger')
const cron = require('node-cron')
const JobQueries = require('./services/JobsQueries')
const PORT = process.env.PORT || 8080

const User = require("./models/User")
const Msisdn = require("./models/Msisdn")
const Contact = require("./models/Contact")
const Message = require("./models/Message")
const Sender = require("./models/Sender")
const ContactMsisdnUser = require("./models/ContactMsisdnUser")

const docRoutes = require("./routes/api.docs.route")
const messagesRoutes = require("./routes/messages")
const userRoutes = require("./routes/users")
const contactRoutes = require("./routes/contacts")

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

// tables associations
User.hasMany(Sender);
Sender.belongsTo(User);
Message.belongsTo(Sender);
Sender.hasMany(Message);
Contact.belongsToMany(User, {through: ContactMsisdnUser})
User.belongsToMany(Contact, {through: ContactMsisdnUser})
Msisdn.belongsToMany(Contact, {through: ContactMsisdnUser})
Contact.belongsToMany(Msisdn, {through: ContactMsisdnUser})

//404 middleware, should be below routes
app.use((request, response, next) =>
	response.status(NOTFOUND).send({
		errorCode: FAILURE_CODE,
		errorMessage: `${request.originalUrl} not found`,
	})
)

// 500 middleware
app.use((error, request, response, next) => {
	console.error(error.stack)
	return response.status(SERVER_ERROR).send({
		errorCode: FAILURE_CODE,
		errorMessage: "An unexpected error occured.",
	})
});


(async () => {
	try {


        await Promise.all([database.authenticate(), Queue.createQueue(MESSAGES_QUEUE)])
		//
		//
        // require("./services/MessageQueueWorker").start()
		//
		// logger.log("database connection has been established successfully.")
		//
        app.listen(PORT, () => console.log(`app listening on localhost:${PORT}`))
        // app.use(logger.rollbar.errorHandler())
		//
        // // Run job every 10 minutes
        // cron.schedule('*/1 * * * *', async () => {
		//
        //     let messages = await JobQueries.findPendingFailedMessages()
		//
        //     console.log('Messages to retry: ', {messages})
		//
        //     // add messages to queue
        //     for (message of messages) {
        //         Queue.add(message, MESSAGES_QUEUE)
        //         await Message.update({retries: 1}, {where: {id: message.id}})
        //     }
		//
        // })

	} catch (error) {
        console.log(error)
        // logger.error("Unable to connect to the database:", error)
	}
})()