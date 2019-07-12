const express = require('express'),
    router = express.Router(),
    passport = require('../middlewares/passport'),
    authMiddleware = require('../middlewares/auth'),
    usersController = require('../controllers/users');


router.get('/login-signup', authMiddleware.notAuthenticated, (request, response) => {
    response.render('auth/login-signup', {
        message: request.flash('error')
    })
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login-signup',
    failureFlash: true
}));

router.post('/signup', usersController.createUser);

router.get('/logout', usersController.logout);

module.exports = router;