const router = require("express").Router()
const MessagesController = require("../controllers/MessagesController")
const {authenticate, senderIsValid} = require("../middlewares")
const {validateAll, validateStore, validateExport} = require("../validators/messages")

router.route('/sms')
	.get([authenticate, validateAll], MessagesController.all)
	.post([authenticate, senderIsValid, validateStore], MessagesController.send)

router.get("/sms/stats", authenticate, MessagesController.statistics)

router.post("/sms/export", [authenticate, validateExport], MessagesController.export)

router.route("/sms/status")
	.get(MessagesController.bulkGateUpdateStatus) // for bulkgate
	.post(MessagesController.handleOrangeDR) // for orange

module.exports = router;
