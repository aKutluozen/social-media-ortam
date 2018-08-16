var express = require('express');
var CHAT_ROUTER = express.Router();
var app = express();
var jwt = require('jsonwebtoken');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Room = require('../models/room');
var User = require('../models/user');
var misc = require('../misc');

var roomsNumbers = [];

Room.find((err, rooms) => {
    for (let room of rooms) {
        roomsNumbers.push({
            name: room.name,
            number: 0
        });
    }
});

// Get old room, new room
CHAT_ROUTER.post('/room', function (req, res) {
    var token = jwt.decode(req.query.token);

    User.findById(token.id, function (err, user) {
        misc.checkUserErrors(err, res, user, token, () => {
            // Check if the days are up. if so, say banned. If not, fix it in the database too and let the user in
            if (user.bannedChat.isBanned == false || !user.bannedChat.isBanned) {
                for (let room of roomsNumbers) {
                    if (room.name === req.body.room.name) {
                        room.number++;
                    }
                    else if (req.body.oldRoom) {
                        if (room.name === req.body.oldRoom.name) {
                            room.number--;
                        }
                    }
                }
                return res.status(200).json({
                    message: 'room is',
                    data: ''
                });
            } else {
                return res.status(401).json({
                    message: 'banned',
                    error: 'banned from the room'
                });
            }
        });
    });
});

CHAT_ROUTER.get('/rooms', function (req, res) {
    Room.find((err, rooms) => {
        if (err) {
            return res.status(404).json({
                message: 'No rooms',
                error: err
            });
        }
        return res.status(200).json({
            message: 'rooms found',
            data: rooms
        });
    });
});

// Get the number of people in that room
CHAT_ROUTER.get('/room', function (req, res) {
    return res.status(200).json({
        message: 'numbers',
        data: io.sockets.adapter.rooms
    });
});

io.on('connection', (socket) => {
    socket.on('disconnect', function () {
    });

    socket.on('add-message', (message) => {
        io.emit('message', { type: 'new-message', text: message });
    });
});

http.listen(5000, () => {
    console.log('Chat started on port 5000');
});

module.exports = CHAT_ROUTER;