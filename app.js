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
        var clients = io.sockets.clients(CM);
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
        var clients = io.sockets.clients(CM);
        for(var i in clients){
            data.push({
                id: clients[i].id,
                name: clients[i].name
            })
        }
        socket.broadcast.to(CM).emit('offline', JSON.stringify(data));       
    });

    socket.on('chat request', function(data){
        console.log('====   chat request');
        // console.log(socket.id)
        var clients = io.sockets.clients(CM);
        for(var i in clients){
            if(clients[i].id === data.id){
                clients[i].emit('chat request', {
                    id: socket.id,
                    name: socket.name
                });
            }
        }
    });

    socket.on('stream ok', function(id){
        console.log('====   stream ok', id);
        var clients = io.sockets.clients(CM);
        for(var i in clients){
            if(clients[i].id === id){
                clients[i].emit('stream ok', socket.id);
            }
        }
    });

    socket.on('offer', function(id, data){
        console.log('====   offer ', id);
        var clients = io.sockets.clients(CM);
        for(var i in clients){
            if(clients[i].id === id){
                clients[i].emit('offer', socket.id, data);
            }
        }
    });

    socket.on('answer', function(id, data){
        console.log('====   answer ', id);
        var clients = io.sockets.clients(CM);
        for(var i in clients){
            if(clients[i].id === id){
                clients[i].emit('answer', socket.id, data);
            }
        }
    });

    socket.on('candidate', function(id, data){
        console.log('====   candidate ', id);
        var clients = io.sockets.clients(CM);
        for(var i in clients){
            if(clients[i].id === id){
                clients[i].emit('candidate', data);
            }
        }
    })

});


server.listen(3000);