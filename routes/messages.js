const router = require("express").Router()
const MessagesController = require("../controllers/MessagesController")
const {authenticate, senderIsValid} = require("../middlewares")

router.route('/sms')
	.get(authenticate, MessagesController.all)
	.post([authenticate, senderIsValid], MessagesController.send)

router.get("/sms/stats", authenticate, MessagesController.statistics)

router.route("/sms/status")
	.get(MessagesController.bulkGateUpdateStatus) // for bulkgate
	.post(MessagesController.twilioUpdateStatus) // for twilio

module.exports = router;
