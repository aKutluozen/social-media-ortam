var express = require('express');
var MESSAGE_ROUTER = express.Router(),
    Post = require('../models/post'),
    jwt = require('jsonwebtoken'),
    User = require('../models/user'),
    Message = require('../models/message'),
    misc = require('../misc');

// Protect the routes
// Each request this will execute
MESSAGE_ROUTER.use('/', function (req, res, next) {
    jwt.verify(req.query.token, process.env.SECRET, function (err, decodedToken) {
        if (err) {
            return res.status(401).json({
                message: 'No authentication',
                error: err
            });
        }
        next();
    });
});

// Send message from one user to another
MESSAGE_ROUTER.post('/message/:receiver/', function (req, res) {
    // Find the receiver first
    var token = jwt.decode(req.query.token),
        receiver = req.params.receiver,
        sender = token.id,
        message = req.body.message;

    // This message will be attached to a messaging object
    var msg = {
        sender: sender,
        receiver: receiver,
        date: Date.now(),
        message: message
    }

    // First find the sender user
    User.findById(sender, function (err, user) {
        misc.checkUserErrors(err, res, user, token, () => {
            msg.sender = user.nickName;

            // Found, store it
            var senderUser = user;

            // Find the other user
            User.findOne({ nickName: receiver }, function (err, otherUser) {
                misc.checkUserErrors(err, res, otherUser, null, () => {

                    // Found, store it
                    var receiverUser = otherUser;
                    // Both users are found! Now create a message referencing them both!

                    // Find the message by user pair
                    Message.findOne({ $or: [{ initiator: senderUser, initiated: otherUser }, { initiator: otherUser, initiated: senderUser }] }, function (err, message) {
                        if (err) {
                            return res.status(500).json({
                                message: 'An error occured finding the message',
                                error: err
                            });
                        }

                        // Not found, create it for the first time
                        if (!message) {
                            var newMessage = new Message({
                                messages: [msg],
                                created: Date.now(),
                                // Set up the referencing
                                initiator: senderUser,
                                initiated: receiverUser
                            });

                            newMessage.save(function (err, result) {
                                if (err) {
                                    return res.status(500).json({
                                        message: 'Message cant be created',
                                        error: err
                                    });
                                }
                                return res.status(200).json({
                                    message: 'Message created!',
                                    data: result
                                });
                            });
                            // Found, just attach to it
                        } else {
                            message.messages = message.messages.slice(-100); // Keep last 100 messages !!!
                            message.messages.push(msg);

                            // other person hasn't read yet!
                            if (message.initiator.toString() === token.id) {
                                message.initiatedRead = false;
                                message.initiatorRead = true;
                            }

                            if (message.initiated.toString() === token.id) {
                                message.initiatorRead = false;
                                message.initiatedRead = false;
                            }

                            message.save(function (err, result) {
                                if (err) {
                                    return res.status(500).json({
                                        message: 'An error occured',
                                        error: err
                                    });
                                }

                                return res.status(201).json({
                                    message: 'Message added',
                                    data: result
                                });
                            });
                        }
                    });
                });
            });
        });
    });
});

// Get messages with a given friend
MESSAGE_ROUTER.get('/message/:id/', function (req, res) {
    // Get a message that is unique to a user pair
    Message.findById(req.params.id, function (err, messages) {
        if (err || !messages) {
            return res.status(500).json({
                message: 'problem finding messages with friend',
                error: err
            });
        }

        return res.status(201).json({
            data: messages
        });
    });
});

// Get messages with a given friend
MESSAGE_ROUTER.get('/user/:nickNameOther/:nickNameThis', function (req, res) {
    var thisId, otherId;

    // Get ids from nick names
    var gettingOtherID = new Promise((resolve, reject) => {
        User.findOne({ nickName: req.params.nickNameOther }, (err, user) => {
            if (err) reject();
            thisId = user._id;
            resolve();
        });
    });

    var gettingThisID = new Promise((resolve, reject) => {
        User.findOne({ nickName: req.params.nickNameThis }, (err, user) => {
            if (err) reject();
            otherId = user._id;
            resolve();
        });
    })

    Promise.all([gettingThisID, gettingOtherID]).then(values => {
        Message.findOne({ $or: [{ initiator: thisId, initiated: otherId }, { initiator: otherId, initiated: thisId }] }, function (err, message) {
            if (err || !message) {
                return res.status(500).json({
                    message: 'An error occured finding the message',
                    error: err
                });
            }
            return res.status(200).json({
                message: 'messages',
                data: message._id
            });
        });
    }).catch(error => {
        return res.status(500).json({
            message: 'An error occured finding the message',
            error: err
        });
    });
});

// Delete messages with a given friend
MESSAGE_ROUTER.delete('/message/:id/', function (req, res) {
    // Get a message that is unique to a user pair
    Message.remove({
        _id: req.params.id
    }, function (err, messages) {
        if (err || !messages) {
            return res.status(500).json({
                message: 'problem finding messages with friend',
                error: err
            });
        }

        return res.status(201).json({
            message: 'Message removed!',
            data: messages
        });
    });
});

// Get last messages with a given friend
MESSAGE_ROUTER.get('/message/:latest/:id/', function (req, res) {
    var latest = req.params.latest;

    // Get a message that is unique to a user pair
    Message.findOne({
        _id: req.params.id
    }, function (err, allMessages) {
        if (err || !allMessages) {
            return res.status(500).json({
                message: 'problem finding messages with friend',
                error: err
            });
        }

        var newMessagesToSend = [];

        // Start from the end, check each date
        for (let i = allMessages.messages.length; i--;) {
            if (allMessages.messages[i].date > latest) {
                newMessagesToSend.unshift(allMessages.messages[i]);
            }
        }

        return res.status(201).json({
            data: newMessagesToSend
        });
    });
});

// Get all messages
MESSAGE_ROUTER.get('/all/:offset', function (req, res) {
    var token = jwt.decode(req.query.token),
        id = token.id,
        offset = parseInt(req.params.offset);

    // Find the user that have the messages
    User.findById(id, function (err, user) {
        misc.checkUserErrors(err, res, user, token, () => {
            var name = user.nickName;

            // Determine whose picture to get!
            Message.find(
                { $or: [{ initiator: id }, { initiated: id }] },
                { created: 1, initiator: 1, initiated: 1, initiatorRead: 1, initiatedRead: 1, messages: { $slice: -1 } })
                .populate('initiator', ['nickName', 'profilePicture'])
                .populate('initiated', ['nickName', 'profilePicture'])
                .sort({ 'messages.date': -1 })
                .limit(5)
                .skip(offset)
                .exec(function (err, messages) {
                    if (err || !messages) {
                        return res.status(500).json({
                            message: 'problem finding messages of users',
                            error: err
                        });
                    }

                    return res.status(200).json({
                        message: 'Success',
                        data: messages
                    });
                });
        });
    });
});

module.exports = MESSAGE_ROUTER;