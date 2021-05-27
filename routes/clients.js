const express = require("express");
const router = express.Router();
const ClientsController = require("../controllers/ClientsController");

router.get("/clients", ClientsController.all);

module.exports = router;
