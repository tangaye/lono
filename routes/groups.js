const router = require("express").Router();
const GroupsController = require("../controllers/GroupsController");
const {authenticate} = require("../middlewares")
const {validateStore, validateUpdate, validateAll} = require("../validators/groups")

router.route('/groups')
	.get([authenticate, validateAll], GroupsController.all)
	.post([authenticate, validateStore], GroupsController.store)

router.patch('/groups/:id', [authenticate, validateUpdate], GroupsController.update)
router.get('/groups/:id', authenticate, GroupsController.get)
router.delete('/groups/:id', authenticate, GroupsController.remove)

module.exports = router;
