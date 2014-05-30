var path = require('path');
var http = require('http');

var express = require('express');
var app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req, res, next){
    console.log('Add access alllow');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    next();
});

var server = http.createServer(app);
var io = require('socket.io').listen(server);

// Let's start managing connections...
io.on('connection', function(socket) {
    // Handle 'message' messages
    socket.on('message', function(message) {
        log('S --> got message: ', message);
        // channel-only broadcast...
        socket.broadcast.to(message.channel).emit('message', message);
    });
    // Handle 'create or join' messages
    socket.on('create or join', function(room) {
        var numClients = io.sockets.clients(room).length;
        log('S --> Room ' + room + ' has ' + numClients + ' client(s)');
        log('S --> Request to create or join room', room);
        // First client joining...
        if (numClients == 0) {
            socket.join(room);
            socket.emit('created', room);
        } else if (numClients == 1) {
            // Second client joining...
            io.sockets.in(room).emit('join', room);
            socket.join(room);
            socket.emit('joined', room);
        } else { // max two clients
            socket.emit('full', room);
        }
    });

    function log() {
        var array = [">>> "];
        for (var i = 0; i < arguments.length; i++) {
            array.push(arguments[i]);
        }
        socket.emit('log', array);
    }
});


server.listen(3000);
