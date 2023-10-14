const router = require("express").Router()
const MessagesController = require("../controllers/MessagesController")
const {authenticate, senderIsValid} = require("../middlewares")
const {validateAll, validateStore, validateExport} = require("../validators/messages")

router.route('/sms')
	.get([authenticate, validateAll], MessagesController.all)
	.post([authenticate, senderIsValid, validateStore], MessagesController.send)

router.get("/sms/stats", authenticate, MessagesController.statistics)
router.post("/sms/export", [authenticate, validateExport], MessagesController.export)

router.post("/sms/status", MessagesController.orangeDR)
router.get("/sms/dr/bulkgate", MessagesController.bulkgateDR)
router.post("/sms/dr/dseven", MessagesController.dsevenDR)

module.exports = router;
