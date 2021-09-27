const express = require("express");
const router = express.Router();
const UsersController = require("../controllers/UsersController");
const {requiresAdmin, userIsValid} = require("../middlewares");

router.get("/users", requiresAdmin, UsersController.all)
router.get("/users/account", userIsValid, UsersController.getAccountDetails)

module.exports = router;
