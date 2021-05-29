const express = require("express");
const ROUTER  = express.Router();
const path = require("path");



ROUTER.get('/', (request, response) => {
    response.sendFile(path.join(__dirname, '../views/', 'api.docs.html'));
})

module.exports = ROUTER;

// const EXPRESS = require('express');
// const ROUTER = EXPRESS.Router();
// const PATH = require('path');
// const REDOC = require('redoc-express');

// // serve swagger.json file
// // ROUTER.get('/docs/swagger.json', (req, res) => {
// //     res.setHeader('Content-Type', 'application/json');
// //     res.sendFile(PATH.join(__dirname, '../public/docs/', 'swagger.json'));
// // });

// // serve redoc
// ROUTER.get(
//     '/',
//     REDOC({
//         title: 'API Docs',
//         specUrl: '/lono.json'
//     })
// );

// module.exports = ROUTER;
