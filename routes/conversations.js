const router = require("express").Router();
const ConversationsController = require("../controllers/ConversationsController");
const { authenticate, authenticateInterchange } = require("../middlewares");

router
	.route("/conversations/interchange")
	.get(ConversationsController.handleOutgoing)
	.post(ConversationsController.handleIncoming);

router
	.route("/conversations")
	.get(authenticate, ConversationsController.all)
	.post(authenticate, ConversationsController.create);

module.exports = router;
