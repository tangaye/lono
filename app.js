const path = require("path")
require("dotenv").config({path: path.join(__dirname, "./.env")})
const express = require("express")
const helmet = require("helmet")
const cors = require("cors")
const app = express()
const MessageQueue = require("./services/MessageQueue")
const {NOTFOUND, SERVER_ERROR, FAILURE_CODE} = require("./constants")
const database = require("./database/connection")
const logger = require('./logger')
const PORT = process.env.PORT || 8080

const User = require("./models/User")
const Message = require("./models/Message")
const Sender = require("./models/Sender")

const docRoutes = require("./routes/api.docs.route")
const messagesRoutes = require("./routes/messages")
const userRoutes = require("./routes/users")

// app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, "public")))

// routes setup
app.use(docRoutes)
app.use("/api/v1/", messagesRoutes)
app.use("/api/v1/", userRoutes)

// db tables associations
User.hasMany(Sender);
Sender.belongsTo(User);
Message.belongsTo(Sender);
Sender.hasMany(Message);

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
		await database.authenticate()
        await MessageQueue.createQueue()

        require("./services/MessageQueueWorker").start()
		logger.log("database connection has been established successfully.")

        app.listen(PORT, () => logger.log(`app listening on localhost:${PORT}`))
        app.use(logger.rollbar.errorHandler())

	} catch (error) {
        console.log(error)
        logger.error("Unable to connect to the database:", error)
	}
})()