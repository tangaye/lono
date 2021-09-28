const express = require("express")
const router = express.Router()
const MessagesController = require("../controllers/MessagesController")
const {userIsValid, senderIsValid} = require("../middlewares")

router.get("/sms", userIsValid, MessagesController.all)
router.post("/sms", [userIsValid, senderIsValid], MessagesController.send)
router.get("/sms/status", MessagesController.bulkGateUpdateStatus) // for bulkgate
router.post("/sms/status", MessagesController.twilioUpdateStatus) // for twilio

module.exports = router;
