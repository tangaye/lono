const express = require("express");
const router = express.Router();
const MessagesController = require("../controllers/MessagesController");
const { setSender, isValidSender } = require("../middlewares/authRequest");

router.get("/sms", setSender, MessagesController.all);
router.post("/sms", [setSender, isValidSender], MessagesController.send);
router.post("/sms/status", MessagesController.updateStatus);

module.exports = router;
