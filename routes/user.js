const express = require('express'),
    authMiddleware = require('../middlewares/auth'),
    router = express.Router();

router.get('/', authMiddleware.isAuthenticated, (request, response) => {
    response.render('chatroom', {
        username: request.user.name
    })
});


module.exports = router;