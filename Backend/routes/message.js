var express = require('express');
var MESSAGE_ROUTER = express.Router(),
    Post = require('../models/post'),
    jwt = require('jsonwebtoken'),
    User = require('../models/user'),
    Message = require('../models/message');

// Protect the routes
// Each request this will execute
MESSAGE_ROUTER.use('/', function(req, res, next) {
    jwt.verify(req.query.token, 'secret', function(err, decodedToken) {
        if (err) {
            return res.status(401).json({
                title: 'No authentication',
                error: err
            });
        }
        next();
    });
});

// Send message from one user to another
MESSAGE_ROUTER.post('/message/:receiver/', function(req, res) {
    // Find the receiver first
    var decoded = jwt.decode(req.query.token),
        receiver = req.params.receiver,
        sender = decoded.id,
        message = req.body.message;

    // This message will be attached to a messaging object
    var msg = {
        sender: sender,
        receiver: receiver,
        date: Date.now(),
        message: message
    }

    // First find the sender user
    User.findById(sender, function(err, user) {
        if (err) {
            return res.status(500).json({
                title: 'An error occured finding the first user',
                error: err
            });
        }

        if (!user) {
            return res.status(404).json({
                title: 'First user not found',
                error: err
            });
        }

        msg.sender = user.nickName;

        // Found, store it
        var senderUser = user;

        // Find the other user
        User.findOne({ nickName: receiver }, function(err, otherUser) {
            if (err) {
                return res.status(500).json({
                    title: 'An error occured finding the other user',
                    error: err
                });
            }

            if (!otherUser) {
                return res.status(404).json({
                    title: 'Other user not found',
                    error: err
                });
            }

            // Found, store it
            var receiverUser = otherUser;
            // Both users are found! Now create a message referencing them both!

            // Find the message by user pair
            Message.findOne({ $or: [{ initiator: senderUser, initiated: otherUser }, { initiator: otherUser, initiated: senderUser }] }, function(err, message) {
                if (err) {
                    return res.status(500).json({
                        title: 'An error occured finding the message',
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

                    newMessage.save(function(err, result) {
                        if (err) {
                            return res.status(500).json({
                                title: 'Message cant be created',
                                error: err
                            });
                        }
                        return res.status(200).json({
                            title: 'Message created!',
                            data: result
                        });
                    });
                    // Found, just attach to it
                } else {
                    message.messages = message.messages.slice(-100); // Keep last 10 messages !!!
                    message.messages.push(msg);

                    // other person hasn't read yet!
                    if (message.initiator.toString() === decoded.id) {
                        message.initiatedRead = false;
                        message.initiatorRead = true;
                    }

                    if (message.initiated.toString() === decoded.id) {
                        message.initiatorRead = false;
                        message.initiatedRead = false;
                    }

                    message.save(function(err, result) {
                        if (err) {
                            return res.status(500).json({
                                title: 'An error occured',
                                error: err
                            });
                        }

                        res.status(201).json({
                            message: 'Message added',
                            data: result
                        });
                    });
                }
            });
        });
    });
});

// Get messages with a given friend
MESSAGE_ROUTER.get('/message/:id/', function(req, res) {
    // Get a message that is unique to a user pair
    Message.findById(req.params.id, function(err, messages) {
        if (err) {
            return res.status(500).json({
                title: 'An error occured finding message with a friend',
                error: err
            });
        }
        if (!messages) {
            return res.status(500).json({
                title: 'Message not found',
                error: err
            });
        }

        res.status(201).json({
            data: messages
        });
    });
});

// Get messages with a given friend
MESSAGE_ROUTER.delete('/message/:id/', function(req, res) {
    // Get a message that is unique to a user pair
    Message.remove({
        _id: req.params.id
    }, function(err, messages) {
        if (err) {
            return res.status(500).json({
                title: 'An error occured deleting message with a friend',
                error: err
            });
        }
        if (!messages) {
            return res.status(500).json({
                title: 'Message not found',
                error: err
            });
        }

        res.status(201).json({
            title: 'Message removed!',
            data: messages
        });
    });
});

// Get last messages with a given friend
MESSAGE_ROUTER.get('/message/:latest/:id/', function(req, res) {
    var latest = req.params.latest;

    // Get a message that is unique to a user pair
    Message.findOne({
        _id: req.params.id
    }, function(err, allMessages) {
        if (err) {
            return res.status(500).json({
                title: 'An error occured',
                error: err
            });
        }
        if (!allMessages) {
            return res.status(500).json({
                title: 'Message not found',
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

        res.status(201).json({
            data: newMessagesToSend
        });
    });
});

// Get all messages
MESSAGE_ROUTER.get('/all/:offset', function(req, res) {
    var decoded = jwt.decode(req.query.token),
        id = decoded.id,
        offset = parseInt(req.params.offset);

    // Find the user that have the messages
    User.findById(id, function(err, user) {
        if (err) {
            return res.status(500).json({
                title: 'An error occured finding user',
                error: err
            });
        }

        if (!user) {
            return res.status(500).json({
                title: 'User not found',
                error: err
            });
        }

        var name = user.nickName;

        // Determine whose picture to get!
        Message.find(
            { $or: [{ initiator: id }, { initiated: id }] }, 
            { created: 1, initiator: 1, initiated: 1, initiatorRead: 1, initiatedRead: 1, messages: { $slice: -1 } })
            .populate('initiator', ['nickName', 'profilePicture'])
            .populate('initiated', ['nickName', 'profilePicture'])
            .sort({'messages.date': -1})
            .limit(5)
            .skip(offset)
            .exec(function(err, messages) {
                if (err) {
                    return res.status(500).json({
                        title: 'An error occured when getting messages of users',
                        error: err
                    });
                }

                if (!messages) {
                    return res.status(404).json({
                        title: 'No message found',
                        error: err
                    });
                }

                res.status(200).json({
                    message: 'Success',
                    messages: messages
                });
            });
    });
});

module.exports = MESSAGE_ROUTER;