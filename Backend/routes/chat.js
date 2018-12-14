var express = require('express');
var CHAT_ROUTER = express.Router();
var app = express();
var jwt = require('jsonwebtoken');
//var http = require('http').Server(app);
var https = require('https');
var fs = require('fs');

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

CHAT_ROUTER.post('/private', function (req, res) {
    User.find({ chatNickName: req.body.name }, function (err, user) {
    });
});

// Get the number of people in that room
CHAT_ROUTER.get('/room', function (req, res) {
    return res.status(200).json({
        message: 'numbers',
        data: io.sockets.adapter.rooms
    });
});

// Server

var privateKey = fs.readFileSync('/etc/ssl/kutatku.key', 'utf-8', function (err) {
    console.log('error loading private key');
});
var certificate = fs.readFileSync('/etc/ssl/kutatku_com.crt', 'utf-8', function (err) {
    console.log('error loading certificate');
});

var options = {
    key: privateKey,
    cert: certificate
}

var server = https.createServer(options, app)
var io = require('socket.io')(server);

io.on('connection', (socket) => {
    socket.on('disconnect', function () {
    });

    socket.on('add-message', (message) => {
        io.emit('message', { type: 'new-message', text: message });
    });

    socket.on('add-private-message', (message) => {
        io.emit('private-message', { type: 'new-private-message', text: message });
    });
});

app.all('/*', function (req, res, next) {
	var allowedOrigins = ['https://kutatku.com', 'https://www.kutatku.com'];
	var origin = req.headers.origin;
	if (allowedOrigins.indexOf(origin) > -1) {
		res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,PATCH,DELETE,OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, *');
	next();
});


server.listen(5000, function (conn) {
    console.log('Chat is listening on port 5000');
});

module.exports = CHAT_ROUTER;