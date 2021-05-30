const express = require("express");
const router = express.Router();
const path = require("path");

router.get("/", (request, response) => {
	response.sendFile(path.join(__dirname, "../views/", "api.docs.html"));
});

module.exports = router;
