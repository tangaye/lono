const isAuthenticated = (request, response, next) => {
    return request.isAuthenticated() ? next() : response.redirect('/login-signup');
}

const notAuthenticated = (request, response, next) => {
    return !request.isAuthenticated() ? next() : response.redirect('/');
}

module.exports = {
    isAuthenticated,
    notAuthenticated
}