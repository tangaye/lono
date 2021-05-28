const express = require("express");
const router = express.Router();
const ClientsController = require("../controllers/ClientsController");
const { forDevOnly } = require("../middlewares/authRequest");
router.get("/clients", forDevOnly, ClientsController.all);

module.exports = router;
