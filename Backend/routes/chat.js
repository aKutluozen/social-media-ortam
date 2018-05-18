var express = require('express');
var CHAT_ROUTER = express.Router();
var app = express();
var jwt = require('jsonwebtoken');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Room = require('../models/room');
var User = require('../models/user');

var room = 'genel',
    counter = [];

CHAT_ROUTER.post('/room', function (req, res) {
    var decoded = jwt.decode(req.query.token);

    User.findById(decoded.id, function (err, user) {
        if (!err && user) {
            // Check if the days are up. if so, say banned. If not, fix it in the database too and let the user in
            if (user.bannedChat.isBanned == false) {
                room = req.body.room;
                res.status(200).json({ message: 'room is ' + room });
            } else {
                res.status(404).json({ message: 'banned!' });
            }
        }
    })
});

CHAT_ROUTER.get('/rooms', function (req, res) {
    Room.find(function (err, rooms) {
        if (err) {
            res.status(404).json({
                message: 'No rooms'
            });
        }
        res.status(200).json({
            rooms: rooms
        });
    });
});

// Get the number of people in that room
CHAT_ROUTER.get('/room', function (req, res) {
    res.status(200).json({ number: io.sockets.adapter.rooms['genel'].length });
});

io.on('connection', (socket) => {
    console.log('user connected');

    socket.on('disconnect', function () {
        console.log('user disconnected');
    });

    socket.on('add-message', (message) => {
        io.in(room).emit('message', { type: 'new-message', text: message });
    });

    socket.on('room', (room) => {
        socket.join(room);
    });
});

http.listen(5000, () => {
    console.log('Chat started on port 5000');
});

module.exports = CHAT_ROUTER;