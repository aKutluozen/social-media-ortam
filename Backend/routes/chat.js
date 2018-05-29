var express = require('express');
var CHAT_ROUTER = express.Router();
var app = express();
var jwt = require('jsonwebtoken');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Room = require('../models/room');
var User = require('../models/user');

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
    var decoded = jwt.decode(req.query.token);

    User.findById(decoded.id, function (err, user) {
        if (!err && user) {
            // Check if the days are up. if so, say banned. If not, fix it in the database too and let the user in
            if (user.bannedChat.isBanned == false || !user.bannedChat.isBanned) {
                // console.log(req.body.room, req.body.oldRoom);
                for (let room = 0; room < roomsNumbers.length; room++) {
                    if (roomsNumbers[room].name === req.body.room.name) {
                        roomsNumbers[room].number++;
                    }
                    else if (req.body.oldRoom) {
                        if (roomsNumbers[room].name === req.body.oldRoom.name) {
                            roomsNumbers[room].number--;
                        }
                    }
                }

                console.log(roomsNumbers);
                res.status(200).json({ message: 'room is ' });
            } else {
                res.status(404).json({ message: 'banned!' });
            }
        }
    })
});

CHAT_ROUTER.get('/rooms', function (req, res) {

    Room.find((err, rooms) => {
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
    res.status(200).json({ number: io.sockets.adapter.rooms });
});

io.on('connection', (socket) => {
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });

    socket.on('add-message', (message) => {
        io.emit('message', { type: 'new-message', text: message });
    });
});

http.listen(5000, () => {
    console.log('Chat started on port 5000');
});

module.exports = CHAT_ROUTER;