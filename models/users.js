const PouchDB = require('pouchdb'),
    usersDb = new PouchDB('users-db'),
    bcrypt = require('bcrypt');

exports.find = id => usersDb.get(id);

exports.create = user => usersDb.post(user);

exports.validPassword = (plainPassword, hashedPassword) => bcrypt.compare(plainPassword, hashedPassword);