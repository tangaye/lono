const express = require("express")
const router = express.Router()
const MessagesController = require("../controllers/MessagesController")
const {authenticate, senderIsValid} = require("../middlewares")

router.get("/sms", authenticate, MessagesController.all)
router.post("/sms", [authenticate, senderIsValid], MessagesController.send)
router.get("/sms/stats", authenticate, MessagesController.getStats)
router.get("/sms/status", MessagesController.bulkGateUpdateStatus) // for bulkgate
router.post("/sms/status", MessagesController.twilioUpdateStatus) // for twilio

module.exports = router;
