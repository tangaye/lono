const router = require("express").Router();
const ContactsController = require("../controllers/ContactsController");
const {authenticate} = require("../middlewares")
const {validateAll, validateCreate, validateUpdate, validateDelete, validateImport, validateStore} = require("../validators/contacts")


router.route('/contacts')
	.get([authenticate, validateAll], ContactsController.all)
	.post([authenticate, validateCreate], ContactsController.create)

router.post('/contacts/import', [authenticate, validateImport], ContactsController.bulkImport)
router.get('/contacts/:id', authenticate, ContactsController.get)
router.patch('/contacts/:id', [authenticate, validateUpdate], ContactsController.update)
router.delete('/contacts/:id',[authenticate, validateDelete], ContactsController.remove)

module.exports = router;
