const PouchDB = require('pouchdb'),
    Users = new PouchDB('users-db'),
    bcrypt = require('bcrypt');

exports.find = id => Users.get(id, {
    attachments: true
});

exports.create = user => Users.post(user);

exports.delete = user => Users.remove(user);

exports.update = user => Users.put(user);

exports.validPassword = (plainPassword, hashedPassword) => bcrypt.compare(plainPassword, hashedPassword);