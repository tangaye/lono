const express = require('express'),
    passport = require('./middlewares/passport'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    path = require('path'),
    authRoutes = require('./routes/auth'),
    userRoutes = require('./routes/user'),
    flash = require('connect-flash'),
    fileUpload = require('express-fileupload');

server.listen(3000, () => console.log('App listening on port 3000'));

const sessionMiddleware = session({
    secret: 's3Cur3',
    name: 'sessionId',
    resave: true,
    saveUninitialized: true,
});

// Configure app
app.use(express.static(path.join(__dirname, 'public')))
    .set('views', 'views')
    .set('view engine', 'ejs')
    // .use(bodyParser.json())
    .use(bodyParser.urlencoded({
        extended: true
    }))
    .use(cookieParser())
    .use(flash())
    .use(fileUpload({
        parseNested: true
    }))
    .use(sessionMiddleware)
    .use(passport.initialize())
    .use(passport.session())
    .use(authRoutes)
    .use(userRoutes);


// io.use((socket, next) => sessionMiddleware(socket.request, socket.request.res, next));

// const users = [];
// const messages = [];

// io.on('connection', socket => {

//     // 1. find user
//     let user = findUser(socket.request.sessionID);

//     // 2. Check if user was found. If so............
//     if (user !== undefined) {

//         /* a. Set user connected status to true.
//          * This is set when the user logs in, but I needed a way to determine if a user is still connected after the user page refreshes or browser section closes.
//          * 
//          */
//         user.connected = true;
//         user.status = 'online';
//         user.loggedId = true;
//         user.socketIds.push(socket.id);

//         // b. If user was found, tell all connected sockets about existing users
//         socket.emit('connected', user, users, messages);
//         socket.broadcast.emit('user reconnected', users);
//     }

//     // otherwise allow new users to login

//     // WHAT TO DO WHEN USER IS CHATTING
//     socket.on('send message', message => {

//         // 1. Find the user that is chatting
//         let user = findUser(socket.request.sessionID);

//         // 3. Push user message to messages array
//         messages.push(message);

//         // 2. Send user message to all connected sockets
//         socket.broadcast.emit('broadcast message', user, message);

//     });

//     // WHAT TO DO WHEN A USER LOGSIN
//     socket.on('login', (username, callback) => {

//         if (userExists(username)) {

//             callback({
//                 error: '&#128577; Username is taken, please choose another....'
//             });


//         } else {

//             callback({
//                 success: 'success'
//             });

//             //  1. Populate user info
//             let user = {
//                 sessionId: socket.request.sessionID,
//                 name: username,
//                 status: 'online',
//                 connected: true,
//                 socketIds: [socket.id]
//             };

//             //  2. log user in
//             login(user);

//             // sending to all clients except sender
//             // socket.broadcast.emit('broadcast message', users, messages);

//             // 3. Tell all connected users about new user
//             io.emit('logged in', user.name, users, messages);
//             socket.emit('user details', user, users, messages);
//         }

//     });

//     // WHAT TO DO WHEN USER TOGGLES STATUS B/W IDLE/ONLINE
//     socket.on('update status', status => {

//         // 1. find user that is toggling status
//         let user = findUser(socket.request.sessionID);

//         // 2. Check if user wasn't found. If so, return doing nothing
//         if (user === undefined) return;

//         // 3. Update user status
//         user.status = status;

//         // 3. Tell all connected users about user updated status
//         socket.broadcast.emit('status updated', user);
//     });

//     socket.on('update message', (message, status) => {

//         let updatedMessage = updateMessageStatus(message, status);

//         io.emit('updated message', updatedMessage);

//     })

//     // WHAT TO DO WHEN A USER GETS DISCONNECTED
//     socket.on('disconnect', () => {

//         let user = findUser(socket.request.sessionID);

//         // 2. Check if user wasn't found. If so, return doing nothing
//         if (user === undefined) return;

//         // 1. remove the user channel that was disconnected
//         user.socketIds.splice(socket.id, 1);

//         // 3. Set user connected status to false
//         user.connected = false;
//         user.status = 'offline';
//         user.loggedId = false;

//         // 5. Wait for 10secs to see if the user will reconnect
//         setTimeout(() => {

//             // a. If user doesn't reconnect after 10secs disconnect user
//             if (!user.connected) logout(user);

//         }, 5000);

//     });


// });

// // Add user to users array
// const login = user => users.push(user);

// // logout user
// const logout = user => {

//     // 2. Check if user channels is === 0, if so...
//     if (user.socketIds.length === 0) {

//         // a. set user status to offline
//         user.lastSeen = new Date();

//         // b. tell all connected sockets that a user has left the chat
//         io.emit('disconnected', users);
//     }
// }

// const updateMessageStatus = (msg, status) => {
//     let message = messages.find(message => message.id === msg.id);

//     if (message) {
//         message.status = status;
//         return message;
//     }
// }

// // find user base on browser session id
// const findUser = sessionId => users.find(user => user.sessionId === sessionId);

// const userExists = username => users.find(user => user.name === username);