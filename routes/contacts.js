const router = require("express").Router();
const ContactsController = require("../controllers/ContactsController");
const {isAdmin, authenticate} = require("../middlewares");

router.route('/contacts')
	.get(authenticate, ContactsController.all)
	.post(authenticate, ContactsController.store)

module.exports = router;
