const router = require("express").Router();
const GroupsController = require("../controllers/GroupsController");
const {authenticate} = require("../middlewares")

router.route('/groups')
	.get(authenticate, GroupsController.all)
	.post(authenticate, GroupsController.store)

module.exports = router;
