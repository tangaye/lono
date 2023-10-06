const router = require("express").Router();
const ContactsController = require("../controllers/ContactsController");
const {authenticate} = require("../middlewares")
const {validateAll, validateCreate, validateStore} = require("../validators/contacts")

router.post('/contacts/create', [authenticate, validateCreate], ContactsController.create)

router.route('/contacts')
	.get([authenticate, validateAll], ContactsController.all)
	.post([authenticate, validateStore], ContactsController.store)

router.get('/contacts/:id', authenticate, ContactsController.get)
router.delete('/contacts/:id', authenticate, ContactsController.remove)

module.exports = router;
