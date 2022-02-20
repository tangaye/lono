const router = require("express").Router();
const ContactsController = require("../controllers/ContactsController");
const {authenticate} = require("../middlewares")
const {validateAll, validateStore} = require("../validators/contacts")

router.route('/contacts')
	.get([authenticate, validateAll], ContactsController.all)
	.post([authenticate, validateStore], ContactsController.store)

module.exports = router;
