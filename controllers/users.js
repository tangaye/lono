const User = require('../models/user'),
    bcrypt = require('bcrypt'),
    SALT_ROUNDS = 10,
    DOC_CONFLICT = 409;


// Create and sign in user(signup)    
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

// Read user data, for updating or etc
exports.editUser = (request, response) => response.render('users/edit', {
    user: request.user
});

// Update user data
exports.updateUser = (request, response) => {


    User.find(request.user.id)
        .then(user => {

            let updateUser;

            if (request.files.photo) {

                imageBase64 = Buffer.from(request.files.photo.data).toString('base64');

                updateUser = {
                    _id: user._id,
                    _rev: user._rev,
                    name: request.body.name,
                    password: user.password,
                    _attachments: {
                        photo: {
                            content_type: request.files.photo.mimetype,
                            data: imageBase64,

                        }
                    }
                }

            } else {

                updateUser = {
                    _id: user._id,
                    _rev: user._rev,
                    name: request.body.name,
                    password: user.password,
                    _attachments: user._attachments
                }

            }



            return User.update(updateUser);

        })
        .then(updatedUser => response.redirect('/user/edit'))
        .catch(error => console.error(error));
}

// Delete user data
exports.deleteUser = (request, response) => {

    User.find(request.user.id)
        .then(user => User.delete(user))
        .then(() => {
            request.logout();
            response.redirect('/login-signup');
        })
        .catch(error => console.error(error));
}

exports.getPhoto = id => User.getAttachment(id);

exports.logout = (request, response) => {
    request.logout();
    response.redirect('/login-signup');
}

const hashPassword = (password, salt) => bcrypt.hash(password, salt);

const errorHandler = (error, request, response) => {
    // user already exists
    if (error.status === DOC_CONFLICT) {

        request.flash('error', '** Phone number already exists **');
        response.redirect('/login-signup');
    }

}