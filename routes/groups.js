const router = require("express").Router();
const GroupsController = require("../controllers/GroupsController");
const {authenticate} = require("../middlewares")
const {validateStore, validateAll} = require("../validators/groups")

router.route('/groups')
	.get([authenticate, validateAll], GroupsController.all)
	.post([authenticate, validateStore], GroupsController.store)

router.get('/groups/:id', authenticate, GroupsController.getContacts)

module.exports = router;
