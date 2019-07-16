const passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    User = require('../models/user');

passport.serializeUser((user, done) => done(null, user._id));

passport.deserializeUser((id, done) => {

    User.find(id)
        .then(user => done(null, {
            id: user._id,
            rev: user._rev,
            name: user.name,
            photo: user._attachments ? `data:${user._attachments.photo.content_type};base64,${user._attachments.photo.data}` : null
        }))
        .catch(error => done(error, null));

});


passport.use(new LocalStrategy({
        usernameField: 'phone',
        password: 'password'
    },
    (phone, password, done) => {

        User.find(phone) // find user by phone number
            .then(user => user) // return found user or catch error thrown
            .then(user => Promise.all([user, User.validPassword(password, user.password)])) // validate found user pwd
            .then(results => {

                let user = results[0];
                let validPassword = results[1];

                validPassword ? done(null, user) : done(null, false, {
                    message: '** I\'m sorry. Do I know you? &#129300; &#128580; **'
                });

            })
            .catch(error => {

                console.error(error);

                done(null, false, {
                    message: '** Ooops! &#x1F62C; &#129301; Something went wrong. We are doing all we can to fix &#128296; &#128170; it.. **'
                });

            })

    }
));


module.exports = passport;