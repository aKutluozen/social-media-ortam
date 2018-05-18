var express = require('express');
var USER_ROUTER = express.Router(),
    User = require('../models/user'),
    Post = require('../models/post'),
    Room = require('../models/room'),
    Message = require('../models/message'),
    bcrypt = require('bcryptjs'),
    jwt = require('jsonwebtoken');

var multer = require('multer'),
    multerS3 = require('multer-s3'),
    AWS = require('aws-sdk');

// Handling image upload
AWS.config.loadFromPath('./s3_config.json');
var s3 = new AWS.S3();

var misc = require('../misc');

// Protect all the rest of the requests starting with "/user" if the user doesn't have a token
USER_ROUTER.use('/user', function (req, res, next) {
    jwt.verify(req.query.token, 'secret', function (err, decodedToken) {
        if (err) {
            return res.status(401).json({
                title: 'No authentication',
                error: err
            });
        }
        next();
    });
});

// Multer middleware
var upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'socialmediaimages2017/user_images',
        metadata: function (req, file, cb) {
            cb(null, {
                fieldName: file.fieldname
            });
        },
        key: function (req, file, cb) {
            cb(null, Date.now().toString() + file.originalname)
        }
    })
});

// Update profile picture
USER_ROUTER.post('/user/profilePicture', upload.any(), function (req, res) {
    var decoded = jwt.decode(req.query.token);

    User.findById(decoded.id, function (err, user) {
        misc.checkUserErrors(res, err, user, decoded, () => {
            // Then, add the new one
            user.profilePicture = req.files[0].key;

            user.save(function (err, result) {
                if (err) {
                    return res.status(500).json({
                        title: 'An error occured',
                        error: err
                    });
                }
                res.status(200).json({
                    message: 'Profile image updated!',
                    fileName: req.files[0].key
                });
            });
        });
    });
});

USER_ROUTER.get('/user/friend/:nickName', function (req, res) {
    var decoded = jwt.decode(req.query.token);
    User.findById(decoded.id, function (err, user) {
        if (err || !user) {
            return res.status(404).json({message: err});
        }

        let flag = false;
        for (let friend of user.following) {
            if (friend.nickName === req.params.nickName) {
                flag = friend.accepted;
                break;
            }
        }

        return res.status(200).json(flag);
    })
});

// isAdding expects true or false
USER_ROUTER.patch('/user/credit/:nickName/:isAdding/:credit', function (req, res) {
    User.findOne({nickName: req.params.nickName}, function(err, user) {
        if (err || !user) {
            return res.status(400).json({message: err});
        }

        // Create the field if not there
        if (!user.credit) {
            user['credit'] = 0;
        }

        if (req.params.isAdding === 'true') {
            user.credit += parseInt(req.params.credit); 
        } else {
            user.credit -= parseInt(req.params.credit); 
        }

        user.save(function(err, result) {
            if (!err)
            console.log('\ncredit adjusted!\n', result);
        })
    })
});

// Add a complaint
USER_ROUTER.post('/user/complaint', function (req, res) {
    Room.findOne({ name: req.body.complaint.room.name }, (err, room) => {
        if (err || !room) {
            return res.status(404).json({
                message: 'Room not found'
            });
        }

        // Room is found, find mod(s)
        User.update({ nickName: { $in: room.mods } }, {
            $push: {
                complaintInbox: {
                    complaint: req.body.complaint
                }
            }
        }, function (err, result) {
            console.log(err);
            console.log(result);
        });

        User.find({ nickName: { $in: room.mods } }, { nickName: 1, complaintInbox: 1 }, (err, mods) => {
            if (err || !mods) {
                return res.status(404).json({
                    message: 'Mods not found'
                });
            }

            // Mods found, notify them - loop
            for (let i = 0; i < mods.length; i++) {
                var cb = () => { };
                if (i == mods.length - 1) {
                    cb = () => {
                        res.status(200).json({});
                    }
                }

                // !! Put this to a different inbox
                misc.notifyUsers(User, jwt.decode(req.query.token).id, req.body.complaint, mods[i].nickName, 'complaint', cb);
            }
        });


        // User.find({ nickName: { $in: room.mods } }, { nickName: 1, complaintInbox: 1 }, (err, mods) => {
        //     if (err || !mods) {
        //         return res.status(404).json({
        //             message: 'Mods not found'
        //         });
        //     }

        //     // Mods found, notify them - loop
        //     for (let i = 0; i < mods.length; i++) {
        //         var cb = () => { };
        //         if (i == mods.length - 1) {
        //             cb = () => {
        //                 res.status(200).json({});
        //             }
        //         }


        //         // !! Put this to a different inbox
        //         misc.notifyUsers(User, jwt.decode(req.query.token).id, req.body.complaint, mods[i].nickName, 'complaint', cb);
        //     }
        // });
    });
});

// // Add a complaint
// USER_ROUTER.post('/user/complaint', function (req, res) {
//     Room.findOne({ name: req.body.complaint.room.name }, (err, room) => {
//         if (err || !room) {
//             return res.status(404).json({
//                 message: 'Room not found'
//             });
//         }

//         // Room is found, find mod(s)
//         User.update({ nickName: { $in: room.mods } }, {
//             $push: {
//                 complaintInbox: {
//                     complaint: req.body.complaint
//                 },

//             }
//         }, (err) => {
//             if (!err) {
//                 return res.status(200).json({
//                     message: 'Complaint sent!'
//                 });
//             }
//         });
//     });
// });

USER_ROUTER.get('/user/complaints', (req, res) => {
    var decoded = jwt.decode(req.query.token);

    User.findById(decoded.id, (err, user) => {
        if (err || !user) {
            return res.status(404).json({
                message: 'problem',
                err: err
            });
        }
        return res.status(200).json({
            complaints: user.complaintInbox
        })
    })
});

USER_ROUTER.delete('/user/profilePicture', function (req, res) {
    var decoded = jwt.decode(req.query.token);

    User.findById(decoded.id, function (err, user) {
        misc.checkUserErrors(res, err, user, decoded, () => {
            // Delete it from S3 first!
            s3.deleteObject({
                Bucket: 'socialmediaimages2017',
                Key: 'user_images/' + user.profilePicture
            }, function (err, data) {
                if (err) {
                    res.status(404).json({
                        message: 'Profile image not found!'
                    });
                } else {

                    // Then empty users picture slot
                    user.profilePicture = '';
                    user.save(function (err, result) {
                        if (err) {
                            return res.status(500).json({
                                title: 'An error occured',
                                error: err
                            });
                        }
                        res.status(200).json({
                            message: 'Profile image deleted!',
                            filename: ''
                        });
                    });
                }
            });
        });
    });
});

USER_ROUTER.post('/user/ban/:person/:days', function (req, res) {
    User.update(
        { nickName: req.params.person },
        { bannedChat: { isBanned: true, days: req.params.days, banDate: Date.now() } },
        function (err, user) {
            if (!err) {
                return res.status(200).json({
                    message: 'success'
                });
            } else {
                return res.status(500).json({
                    message: 'problem'
                })
            }
        })
});

// Update cover picture
USER_ROUTER.post('/user/coverImage', upload.any(), function (req, res) {
    var decoded = jwt.decode(req.query.token);

    User.findById(decoded.id, function (err, user) {
        misc.checkUserErrors(res, err, user, decoded, () => {
            // Then, add the new one
            user.coverImage = req.files[0].key;

            user.save(function (err, result) {
                if (err) {
                    return res.status(500).json({
                        title: 'An error occured',
                        error: err
                    });
                }
                res.status(200).json({
                    message: 'Cover image updated!',
                    fileName: req.files[0].key
                });
            });
        });
    });
});

USER_ROUTER.delete('/user/coverImage', function (req, res) {
    var decoded = jwt.decode(req.query.token);

    User.findById(decoded.id, function (err, user) {
        misc.checkUserErrors(res, err, user, decoded, () => {
            // Delete it from S3 first!
            s3.deleteObject({
                Bucket: 'socialmediaimages2017',
                Key: 'user_images/' + user.coverImage
            }, function (err, data) {
                if (err) {
                    res.status(404).json({
                        message: 'Profile image not found!'
                    });
                } else {

                    // Then empty users picture slot
                    user.coverImage = '';
                    user.save(function (err, result) {
                        if (err) {
                            return res.status(500).json({
                                title: 'An error occured',
                                error: err
                            });
                        }
                        res.status(200).json({
                            message: 'Cover image deleted!',
                            filename: ''
                        });
                    });
                }
            });
        });
    });
});

// Upload multiple images
USER_ROUTER.post('/user/images', upload.any(), function (req, res) {
    var decoded = jwt.decode(req.query.token);

    User.findById(decoded.id, function (err, user) {
        misc.checkUserErrors(res, err, user, decoded, () => {
            if (req.files.length > 0) {
                for (let file of req.files) {
                    user.images.push(file.key);
                }
            }

            user.save(function (err, result) {
                if (err) {
                    return res.status(500).json({
                        title: 'An error occured',
                        error: err
                    });
                }
                res.status(200).json({
                    message: 'User images updated!',
                    obj: user.images
                });
            });
        });
    });
});

USER_ROUTER.delete('/user/images', function (req, res) {
    var decoded = jwt.decode(req.query.token);

    User.findById(decoded.id, function (err, user) {
        misc.checkUserErrors(res, err, user, decoded, () => {
            var fileToDelete = decodeURI(req.body.pictureToDelete.split('/user_images/')[1]);

            // Delete it from S3 first!
            s3.deleteObject({
                Bucket: 'socialmediaimages2017',
                Key: 'user_images/' + fileToDelete
            }, function (err, data) {
                if (err) {
                    res.status(404).json({
                        message: 'Image to delete not found!'
                    });
                } else {

                    let pos = user.images.indexOf(fileToDelete);
                    user.images.splice(pos, 1);

                    // Then empty users picture slot
                    user.save(function (err, result) {
                        if (err) {
                            return res.status(500).json({
                                title: 'An error occured',
                                error: err
                            });
                        }

                        res.status(200).json({
                            message: 'Profile image deleted!',
                            location: ''
                        });
                    });
                }
            });
        });
    });
});

// Add a new user
USER_ROUTER.post('/', function (req, res, next) {
    var user = new User({
        nickName: req.body.nickName.toLowerCase(),
        email: req.body.email.toLowerCase(),
        password: bcrypt.hashSync(req.body.password, 10)
    });

    user.save(function (err, result) {
        if (err) {
            return res.status(500).json({
                title: 'An error occured',
                error: err
            });
        }

        res.status(201).json({
            message: 'User created!',
            obj: result
        });
    });
});

// Sign in
USER_ROUTER.post('/signin', function (req, res) {
    User.findOne({
        email: req.body.email
    }, function (err, user) {
        misc.checkUserErrors(res, err, user, null, () => {
            if (!bcrypt.compareSync(req.body.password, user.password)) {
                return res.status(401).json({
                    title: 'Login failed',
                    error: {
                        message: 'Invalid credentials'
                    }
                });
            }

            // Create and send the token
            var token = jwt.sign({
                id: user._id
            }, 'secret', {
                    expiresIn: "1 day"
                });
            res.status(200).json({
                message: 'Successfully logged in',
                token: token,
                userId: user._id,
                name: user.nickName,
                picture: user.profilePicture
            });
        });
    });
});

// Update a user - Profile info
USER_ROUTER.patch('/user', function (req, res, next) {
    var decoded = jwt.decode(req.query.token);

    User.findById(decoded.id, function (err, user) {
        misc.checkUserErrors(res, err, user, decoded, () => {
            // Make them lower case for easy search purposes
            user.firstName = req.body.firstName;
            user.lastName = req.body.lastName;
            user.birthday = req.body.birthday;
            user.bio = req.body.bio;
            user.education = req.body.education;
            user.jobStatus = req.body.jobStatus;

            user.save(function (err, result) {
                if (err) {
                    return res.status(500).json({
                        title: 'An error occured',
                        error: err
                    });
                }
                res.status(200).json({
                    message: 'User updated!',
                    obj: result
                });
            });
        });
    });
});

// Get a user profile
USER_ROUTER.get('/user', function (req, res, next) {
    var decoded = jwt.decode(req.query.token);

    User.findById(decoded.id)
        .populate('following.friend', ['profilePicture'])
        .exec(function (err, user) {
            misc.checkUserErrors(res, err, user, decoded, () => {
                return res.status(200).json({
                    data: user
                });
            });
        });
});

// Get a selected user profile to view
USER_ROUTER.get('/user/requests/:name', function (req, res, next) {
    User.findOne({
        nickName: req.params.name
    }, {
            inbox: 0,
            groups: 0
        }, function (err, user) {
            misc.checkUserErrors(res, err, user, null, () => {
                // Get posts now - private, belongs to user, not shared
                Post.find({ group: 'private', nickName: req.params.name }).populate([{
                    path: 'user',
                    model: User,
                    select: 'nickName profilePicture'
                }, {
                    path: 'shares.user',
                    model: User,
                    select: 'nickName profilePicture'
                }, {
                    path: 'comments.user',
                    model: User,
                    select: 'nickName profilePicture'
                }]).exec(function (err, posts) {
                    if (err) {
                        return res.status(500).json({
                            error: 'error getting posts of profile'
                        });
                    }
                    user.posts = posts;
                    // console.log(posts[0]);
                    return res.status(200).json({
                        data: user
                    });
                });
            });
        });
});

// Search all users by name - NEEDS TO BE IMPROVED TO A MORE FLEXIBLE SEARCH
USER_ROUTER.get('/user/all/:name', function (req, res, next) {
    User.find({
        $or: [{
            nickName: {
                $regex: req.params.name.toLowerCase()
            }
        },
        {
            firstName: {
                $regex: req.params.name.toLowerCase()
            }
        },
        {
            lastName: {
                $regex: req.params.name.toLowerCase()
            }
        }
        ]
    }, {
            _id: 1,
            profilePicture: 1,
            nickName: 1,
            bio: 1,
            firstName: 1,
            lastName: 1,
            education: 1,
            jobStatus: 1,
            following: 1
        },
        function (err, users) {
            misc.checkUserErrors(res, err, users, null, () => {
                return res.status(200).json({
                    data: users
                });
            });
        });
});

// Get the requests of a user
USER_ROUTER.get('/user/requests/all/:offset', function (req, res) {
    var decoded = jwt.decode(req.query.token),
        offset = parseInt(req.params.offset);

    User.findById(decoded.id)
        .populate('following.friend', ['profilePicture'])
        .exec(function (err, data) {
            misc.checkUserErrors(res, err, data, decoded, () => {
                // sort skip etc here
                var result = data.following.reverse().slice(offset, offset + 5);
                return res.status(200).json({
                    data: result
                });
            });
        });
});

// Adds a user to a group
USER_ROUTER.post('/user/groups/:name/:friend', function (req, res) {
    var decoded = jwt.decode(req.query.token);

    // Find this user first
    User.findById(decoded.id, {
        groups: 1
    }, function (err, user) {
        misc.checkUserErrors(res, err, user, null, () => {
            // Find the group
            for (let group of user.groups) {
                if (group.groupName === req.params.name) {
                    group.friends.push(req.params.friend);
                    break;
                }
            }

            user.save(function (err, result) {
                if (err) {
                    return res.status(500).json({
                        title: 'An error occured',
                        error: err
                    });
                }
                res.status(200).json({
                    message: 'Group modified!',
                    obj: result
                });
            });
        });
    });
});

// Delete a friend from a group
USER_ROUTER.delete('/user/groups/:groupName/:friend', function (req, res) {
    var decoded = jwt.decode(req.query.token);

    // // Find this user first
    User.findById(decoded.id, {
        groups: 1
    }, function (err, user) {
        misc.checkUserErrors(res, err, user, null, () => {
            for (let i = 0; i < user.groups.length; i++) {
                if (user.groups[i]['groupName'] === req.params.groupName) {
                    if (user.groups[i]['friends'].includes(req.params.friend)) {
                        var pos = user.groups[i]['friends'].indexOf(req.params.friend);
                        user.groups[i]['friends'].splice(pos, 1);
                    }
                }
            }

            user.save(function (err, result) {
                if (err) {
                    return res.status(500).json({
                        title: 'An error occured',
                        error: err
                    });
                }
                res.status(200).json({
                    message: 'Group modified!',
                    obj: result
                });
            });
        });
    });
});

// Adds a new user group
USER_ROUTER.post('/user/groups/:name', function (req, res) {
    var decoded = jwt.decode(req.query.token);

    // Find this user first
    User.findById(decoded.id, {
        groups: 1
    }, function (err, user) {
        misc.checkUserErrors(res, err, user, null, () => {
            var isDeleting = false,
                pos = 0;

            for (let i = 0; i < user.groups.length; i++) {
                if (user.groups[i].groupName === req.params.name) {
                    isDeleting = true;
                    pos = i;
                }
            }

            // Add a new group
            if (!isDeleting) {
                user.groups.push({
                    groupName: req.params.name,
                    friends: []
                });
            } else {
                user.groups.splice(pos, 1);
            }

            user.save(function (err, result) {
                if (err) {
                    return res.status(500).json({
                        title: 'An error occured',
                        error: err
                    });
                }
                res.status(200).json({
                    message: 'Group modified!',
                    obj: result
                });
            });
        });
    });
});

// Gets all the user groups for a given user
USER_ROUTER.get('/user/groups/', function (req, res) {
    var decoded = jwt.decode(req.query.token);

    // Find this user first
    User.findById(decoded.id, {
        groups: 1
    }, function (err, user) {
        misc.checkUserErrors(res, err, user, decoded, () => {
            return res.status(200).json(user.groups);
        });
    });
});

// Friend request only - Adds it to the receiver's request list
USER_ROUTER.post('/user/follow/:id', function (req, res) {
    var decoded = jwt.decode(req.query.token);

    // Find this user first
    User.findById(decoded.id, {
        nickName: 1
    }, function (err, thisUser) {
        misc.checkUserErrors(res, err, thisUser, null, () => {
            // Find the other user
            User.findById(req.params.id, function (err, otherUser) {
                misc.checkUserErrors(res, err, otherUser, null, () => {

                    var canAdd = true;

                    // Send the request if it is not
                    for (let following of otherUser.following) {
                        // Is there my name on his/her list?
                        if (following.nickName == thisUser.nickName) {
                            canAdd = false;
                            break;
                        }
                    }

                    if (canAdd) {
                        otherUser.following.push({
                            nickName: thisUser.nickName,
                            accepted: false,
                            message: '',
                            friend: decoded.id,
                            date: Date.now()
                        });

                        otherUser.save(function (err, result) {
                            if (err) {
                                return res.status(500).json({
                                    title: 'An error occured',
                                    error: err
                                });
                            }
                            res.status(200).json({
                                message: 'Follow request sent!',
                                obj: result
                            });
                        });
                    } else {
                        res.status(500).json({
                            message: 'Already exists 123!',
                        });
                    }
                });
            });
        });
    });
});

// Make the friend request accepted
USER_ROUTER.patch('/user/follow/:id', function (req, res) {
    var currentUser = '';
    var decoded = jwt.decode(req.query.token);

    // User - The one that is logged in
    User.findById(decoded.id, function (err, user) {
        misc.checkUserErrors(res, err, user, decoded, () => {
            // Object is already there, just make it accepted
            for (let i = 0; i < user.following.length; i++) {
                if (user.following[i].friend == req.params.id) {
                    user.following[i].accepted = true;
                }
            }

            currentUserNickname = user.nickName;
            currentUser = user;

            user.save(function (err, result) {
                if (err) {
                    return res.status(500).json({
                        title: 'An error occured saving the logged in user',
                        error: err
                    });
                }

                // Other user - Friend to be
                User.findById(req.params.id, function (err, otherUser) {
                    misc.checkUserErrors(res, err, otherUser, null, () => {
                        otherUser.following.push({
                            nickName: currentUserNickname,
                            accepted: true,
                            message: '',
                            friend: currentUser,
                            date: Date.now()
                        });

                        otherUser.save(function (err, result) {
                            if (err) {
                                return res.status(500).json({
                                    title: 'An error occured saving other user',
                                    error: err
                                });
                            }
                            res.status(200).json({
                                message: 'Follow request accepted!',
                                obj: result
                            });
                        });
                    });
                });
            });
        });
    });
});

// Make the friend request rejected
USER_ROUTER.delete('/user/follow/:name', function (req, res) {
    var decoded = jwt.decode(req.query.token);

    // User - The on that is logged in
    User.findById(decoded.id, function (err, user) {
        misc.checkUserErrors(res, err, user, decoded, () => {
            // Take it out from there
            for (let i = 0; i < user.following.length; i++) {
                if (user.following[i].nickName === req.params.name) {
                    user.following.splice(i, 1);
                }
            }

            user.save(function (err, result) {
                if (err) {
                    return res.status(500).json({
                        title: 'An error occured',
                        error: err
                    });
                }
                res.status(200).json({
                    message: 'Follow request accepted!',
                    obj: result
                });
            });
        });
    });
});

// Delete friends bi-directionally
USER_ROUTER.delete('/user/unfriend/:name', function (req, res) {
    var decoded = jwt.decode(req.query.token);
    var currentUser = '';
    var userToUnfriend = req.params.name;

    // User - The on that is logged in
    User.findById(decoded.id, function (err, user) {
        misc.checkUserErrors(res, err, user, decoded, () => {
            // Take it out from there
            for (let i = 0; i < user.following.length; i++) {
                if (user.following[i].nickName === req.params.name) {
                    user.following.splice(i, 1);
                }
            }

            user.save(function (err, result) {
                if (err) {
                    return res.status(500).json({
                        title: 'An error occured',
                        error: err
                    });
                }

                // Other user - Friend to be deleted
                User.findOne({
                    nickName: req.params.name
                }, function (err, otherUser) {
                    misc.checkUserErrors(res, err, user, null, () => {
                        currentUser = user.nickName;

                        // Take it out from there
                        for (let i = 0; i < otherUser.following.length; i++) {
                            if (otherUser.following[i].nickName === currentUser) {
                                otherUser.following.splice(i, 1);
                            }
                        }

                        otherUser.save(function (err, result) {
                            if (err) {
                                return res.status(500).json({
                                    title: 'An error occured',
                                    error: err
                                });
                            }
                            res.status(200).json({
                                message: 'Friend is gone!',
                                obj: result
                            });
                        });
                    });
                });
            });
        });
    });
});

// Mark message read
USER_ROUTER.post('/user/inbox/:id', function (req, res) {
    var decoded = jwt.decode(req.query.token);

    // Find all the related messages
    Message.findById(req.params.id, {
        initiator: 1,
        initiated: 1,
        initiatorRead: 1,
        initiatedRead: 1
    }, function (err, message) {
        if (err) {
            return res.status(500).json({
                title: 'An error occured marking the message read',
                error: err
            });
        }

        if (!message) {
            return res.status(404).json({
                title: 'Message not found',
                error: err
            });
        }

        // Check who is reading the message, mark accordingly
        if (message.initiator.toString() === decoded.id) {
            message.initiatorRead = true;
        } else if (message.initiated.toString() === decoded.id) {
            message.initiatedRead = true;
        }

        message.save(function (err, result) {
            return res.status(200).json({
                title: 'Message is marked read',
                message: result
            });
        });
    });
});

// Remove notification
USER_ROUTER.delete('/user/notifications/:id/:type/:user', function (req, res) {

    User.findById(jwt.decode(req.query.token).id, { inbox: 1 }, function (err, user) {
        if (err || !user) {
            return res.status(500).json({ err: err });
        }

        for (let item = 0; item < user.inbox.length; item++) {
            if (user.inbox[item]._id.toString() == req.params.id) {
                user.inbox.splice(item, 1);
                break;
            }
        }
        user.save(function (err, suc) {
            if (!err) {
                return res.status(200).json({ message: 'success' });
            }
        })
    });
});

USER_ROUTER.get('/user/notifications/:offset', function (req, res) {
    var decoded = jwt.decode(req.query.token),
        offset = parseInt(req.params.offset);

    User.findById(decoded.id)
        .populate([{
            path: 'inbox.user',
            model: User,
            select: 'nickName profilePicture'
        }, {
            path: 'inbox.post',
            model: Post,
            select: 'content subject'
        }])
        .exec(function (err, user) {
            misc.checkUserErrors(res, err, user, decoded, () => {
                // Do the skip and limit here
                var result = user.inbox.reverse().slice(offset, offset + 5);

                res.status(200).json({
                    data: result
                });
            });
        });
});

// Checks if there is anything unread in a general level - Make this more specific later!
USER_ROUTER.get('/user/inbox', function (req, res) {
    var decoded = jwt.decode(req.query.token);
    var flag = false;

    // Check for unaccepted friend requests first
    User.findById(decoded.id, function (err, user) {
        misc.checkUserErrors(res, err, user, decoded, () => {
            // Check for waiting friend request
            if (user.following.length > 0) {
                for (let i = 0; i < user.following.length; i++) {
                    // There is a new, waiting request!
                    if (user.following[i].accepted === false) {
                        flag = true;
                    }
                }
            }

            // Check to see if anything the user shared has comment, like etc. on it.
            if (user.inbox.length > 0) {
                flag = true;
            }

            var dd = new Date(user.bannedChat.banDate);

            // Let the user back in if the time is up
            if (dd.getTime() + (1000 * 60 * 60 * 24 * user.bannedChat.days) < Date.now()) {
                user.bannedChat.isBanned = false;
                user.bannedChat.days = 0;
                user.bannedChat.banDate = 0;

                user.save(function (err, res) {
                    if (!err) {
                        console.log('user not banned anymore saved');
                    }
                });
            }

            // Find all the related messages
            Message.find({
                $or: [{
                    initiator: decoded.id
                }, {
                    initiated: decoded.id
                }]
            }, {
                    initiator: 1,
                    initiated: 1,
                    initiatorRead: 1,
                    initiatedRead: 1
                }, function (err, messages) {
                    if (err) {
                        return res.status(500).json({
                            title: 'An error occured find messages of users read',
                            error: err
                        });
                    }

                    if (messages.length > 0) {
                        for (let i = 0; i < messages.length; i++) {
                            // Decide if you are initiator or initiated
                            if (decoded.id === messages[i].initiator.toString()) {
                                if (messages[i].initiatorRead === false) {
                                    flag = true;
                                }
                            } else if (decoded.id === messages[i].initiated.toString()) {
                                if (messages[i].initiatedRead === false) {
                                    flag = true;
                                }
                            }
                        }
                    }

                    return res.status(200).json({
                        title: 'What is new in inbox',
                        message: flag,
                        userSituation: user.bannedChat
                    });
                });
        });
    })
});

// Get inbox numbers
USER_ROUTER.get('/inbox/numbers', function (req, res) {
    var decoded = jwt.decode(req.query.token);

    User.findById(decoded.id, { inbox: 1, following: 1 }, function (err, user) {
        misc.checkUserErrors(res, err, user, decoded, () => {
            var requests = [];
            for (let i = 0; i < user.following.length; i++) {
                // There is a new, waiting request!
                if (user.following[i].accepted === false) {
                    requests.push(user.following[i]);
                }
            }

            Message.find({ $or: [{ initiator: decoded.id }, { initiated: decoded.id }] }, function (err, messages) {
                if (err) {
                    return res.status(500).json({
                        title: 'Error with message numbers'
                    });
                }

                var numbers = {
                    requests: requests.length,
                    notifications: user.inbox.length,
                    messages: messages.length
                }

                return res.status(200).json(numbers);
            });
        });
    });
});

module.exports = USER_ROUTER;