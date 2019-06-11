const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');
const session = require('express-session');
server.listen(4000, () => console.log('App listening on port 4000'));

// Setup views folder and view engine
app.set('view engine', 'ejs');
app.set('views', 'views');

// Setup express to serve static, css and js files from public directory
app.use(express.static(path.join(__dirname, 'public')));

app.set('trust proxy', 1); // trust first proxy
const sessionMiddleware = session({
    secret: 's3Cur3',
    name: 'sessionId',
    resave: true,
    saveUninitialized: true,
});

io.use((socket, next) => sessionMiddleware(socket.request, socket.request.res, next));
app.use(sessionMiddleware);


app.get('/', (request, response) => response.render('index2'));
app.get('/chat', (request, response) => response.render('chat1'));

const users = [];
const messages = [];

io.on('connection', socket => {

    // 1. find user
    let user = findUser(socket.request.sessionID);

    // 2. Check if user was found. If so............
    if (user !== undefined) {

        /* a. Set user connected status to true.
         * This is set when the user logs in, but I needed a way to determine if a user is still connected after the user page refreshes or browser section closes.
         * 
         */
        user.connected = true;

        // b. If user was found, tell all connected sockets about existing users
        socket.emit('connected', users, messages);
    }

    // otherwise allow new users to login

    // WHAT TO DO WHEN USER IS CHATTING
    socket.on('send message', message => {

        // 1. Find the user that is chatting
        let user = findUser(socket.request.sessionID);

        // 3. Push user message to messages array
        messages.push(message);

        // 2. Send user message to all connected sockets
        socket.broadcast.emit('broadcast message', message);

    });

    // WHAT TO DO WHEN A USER LOGS IN
    socket.on('login', username => {

        //  1. Populate user info
        let user = {
            sessionId: socket.request.sessionID,
            name: username,
            status: 'online',
            connected: true,
            socketIds: [socket.id]
        };

        //  2. log user in
        login(user);

        // sending to all clients except sender
        // socket.broadcast.emit('broadcast message', users, messages);

        // 3. Tell all connected users about new user
        io.emit('logged in', user.name, users, messages);

    });

    // WHAT TO DO WHEN USER TOGGLES STATUS B/W IDLE/ONLINE
    socket.on('update status', status => {

        // 1. find user that is toggling status
        let user = findUser(socket.request.sessionID);

        // 2. Check if user wasn't found. If so, return doing nothing
        if (user === undefined) return;

        // 3. Update user status
        user.status = status;

        // 3. Tell all connected users about user updated status
        io.emit('status updated', user);
    });

    // WHAT TO DO WHEN A USER GETS DISCONNECTED
    socket.on('disconnect', () => {

        // 1. find user that is toggling status
        let user = findUser(socket.request.sessionID);

        // 2. Check if user wasn't found. If so, return doing nothing
        if (user === undefined) return;

        // 3. Set user connected status to false
        user.connected = false;

        // 5. Wait for 10secs to see if the user will reconnect
        setTimeout(() => {

            // a. If user doesn't reconnect disconnect user
            if (!user.connected) logout(user, socket.id);

        }, 3000);

    });


});

// Add user to users array
const login = user => users.push(user);

// logout user
const logout = (user, socketId) => {

    // 1. remove the user channel that was disconnected
    user.socketIds.splice(socketId, 1);

    // 2. Check if user channels is === 0, if so...
    if (user.socketIds.length === 0) {

        // a. set user status to offline
        user.status = 'offline';

        // b. tell all connected sockets that a user has left the chat
        io.emit('disconnected', users);
    }
}

// find user base on browser session id
const findUser = sessionId => users.find(user => user.sessionId === sessionId);