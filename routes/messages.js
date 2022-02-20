const router = require("express").Router()
const MessagesController = require("../controllers/MessagesController")
const {authenticate, senderIsValid} = require("../middlewares")
const {validateAll, validateStore} = require("../validators/messages")

router.route('/sms')
	.get([authenticate, validateAll], MessagesController.all)
	.post([authenticate, senderIsValid, validateStore], MessagesController.send)

router.get("/sms/stats", authenticate, MessagesController.statistics)

router.route("/sms/status")
	.get(MessagesController.bulkGateUpdateStatus) // for bulkgate
	.post(MessagesController.twilioUpdateStatus) // for twilio

module.exports = router;
