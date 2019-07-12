const User = require('../models/users'),
    bcrypt = require('bcrypt'),
    SALT_ROUNDS = 10,
    DOC_CONFLICT = 409;

exports.createUser = (request, response, next) => {

    user = {
        _id: request.body.phone,
        name: request.body.username,
        password: request.body.password
    }

    hashPassword(user.password, SALT_ROUNDS) // hash password
        .then(hashedPassword => user.password = hashedPassword) // assign hashed to user
        .then(() => User.create(user)) // store user
        .then(() => request.login(user, error => {

            if (error) return next(error);
            return response.redirect('/')

        })) // login user
        .catch(error => errorHandler(error, request, response)); // catch errors

}

exports.logout = (request, response) => {
    request.logout();
    response.redirect('/login-signup');
}

exports.deleteUser = (request, response) => {

}

const hashPassword = (password, salt) => bcrypt.hash(password, salt);

const errorHandler = (error, request, response) => {
    // user already exists
    if (error.status === DOC_CONFLICT) {

        request.flash('error', '** Phone number already exists **');
        response.redirect('/login-signup');
    }

    console.error('error', error)
}