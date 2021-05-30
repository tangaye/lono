const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "./.env") });
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const app = express();
const MessageQueue = require("./services/MessageQueue");
const { NOTFOUND, SERVER_ERROR, FAILURE_CODE } = require("./constants");
const database = require("./database/connection");
const PORT = process.env.PORT || 8080;

const Client = require("./models/Client");
const Message = require("./models/Message");
const Sender = require("./models/Sender");

const docRoutes = require("./routes/api.docs.route");
const messagesRoutes = require("./routes/messages");
const clientRoutes = require("./routes/clients");

// app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// routes setup
app.use(docRoutes);
app.use("/api/v1/", messagesRoutes);
app.use("/api/v1/", clientRoutes);

// db tables associations
Client.hasMany(Sender);
Sender.belongsTo(Client);
Message.belongsTo(Sender);
Sender.hasMany(Message);

//404 middleware, should be below routes
app.use((request, response, next) =>
	response.status(NOTFOUND).send({
		error_code: FAILURE_CODE,
		error_message: `${request.originalUrl} not found`,
	})
);

// 500 middleware
app.use((error, request, response, next) => {
	console.error(error.stack);
	response.status(SERVER_ERROR).send({
		error_code: FAILURE_CODE,
		error_message: "An unexpected error occured.",
	});
});

app.listen(PORT, () => {
	(async () => await MessageQueue.createQueue())();
	require("./services/MessageQueueWorker").start();
	console.log(`app listening at http://localhost:${PORT}`);
});

(async () => {
	try {
		await database.authenticate();
		console.log("database connection has been established successfully.");
	} catch (error) {
		console.error("Unable to connect to the database:", error);
	}
})();
