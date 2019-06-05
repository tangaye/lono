const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

// Setup views folder and view engine
app.set('view engine', 'ejs');
app.set('views', 'views');

// Setup express to serve static, css and js files from public directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (request, response) => response.render('index'));
app.get('/chat', (request, response) => response.render('chat'));

io.on('connection', socket => {


    console.log('a user connected');

    socket.on('disconnect', () => {
        console.log('a user disconected');
    });

    socket.on('chat', message => {
        io.emit('chat', message);
    });

});

http.listen(4000, () => console.log('App listening on port 4000'));