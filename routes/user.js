const express = require('express'),
    authMiddleware = require('../middlewares/auth'),
    usersController = require('../controllers/users'),
    router = express.Router();

router.get('/', authMiddleware.isAuthenticated, (request, response) => {
    response.render('chatroom', {
        user: request.user
    })
});

router.get('/user/edit', authMiddleware.isAuthenticated, usersController.editUser);

router.post('/user/update', authMiddleware.isAuthenticated, usersController.updateUser);

router.get('/user/delete', authMiddleware.isAuthenticated, usersController.deleteUser);


module.exports = router;