const express = require("express");
const ROUTER  = express.Router();
const path = require("path");



ROUTER.get('/', (request, response) => {
    response.sendFile(path.join(__dirname, '../views/', 'api.docs.html'));
})

module.exports = ROUTER;
