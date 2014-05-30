var path = require('path');
var http = require('http');

var express = require('express');
var app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req, res, next) {
    console.log('Add access alllow');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    next();
});

var server = http.createServer(app);
var io = require('socket.io').listen(server);

var CM = 'chatroom';

io.on('connection', function(socket) {
    socket.on('online', function(name) {
        socket.name = name;
        socket.join(CM);
        var data = [];
        clients = io.sockets.clients(CM);
        // console.log(clients);
        for(var i in clients){
            data.push({
                id: clients[i].id,
                name: clients[i].name
            })
        }
        socket.broadcast.to(CM).emit('online', JSON.stringify(data));
        socket.emit('online', JSON.stringify(data));
    });

    socket.on('disconnect', function(){
        socket.leave(CM);
        var data = [];
        clients = io.sockets.clients(CM);
        for(var i in clients){
            data.push({
                id: clients[i].id,
                name: clients[i].name
            })
        }
        socket.broadcast.to(CM).emit('offline', JSON.stringify(data));       
    });
});


server.listen(3000);