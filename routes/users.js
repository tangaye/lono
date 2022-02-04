const router = require("express").Router()
const UsersController = require("../controllers/UsersController")
const {isAdmin, authenticate} = require("../middlewares")
const {validateAll, validateStore} = require("../validators/users")

router.route("/users")
	.get([authenticate, isAdmin, validateAll], UsersController.all)
	.post([authenticate, isAdmin, validateStore], UsersController.store)

router.get("/users/account", authenticate, UsersController.details)

module.exports = router;
