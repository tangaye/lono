const express = require("express");
const router = express.Router();
const UsersController = require("../controllers/UsersController");
const {isAdmin, authenticate} = require("../middlewares");

router.get("/users", isAdmin, UsersController.all)
router.get("/users/account", authenticate, UsersController.getAccountDetails)

module.exports = router;
