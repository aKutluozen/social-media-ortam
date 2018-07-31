var express = require('express');
var USER_ROUTER = express.Router(),
    User = require('../models/user'),
    Post = require('../models/post'),
    Room = require('../models/room'),
    Message = require('../models/message'),
    bcrypt = require('bcryptjs'),
    jwt = require('jsonwebtoken'),
    multer = require('multer'),
    multerS3 = require('multer-s3'),
    AWS = require('aws-sdk'),
    misc = require('../misc');

// Handling image upload
AWS.config.loadFromPath('./s3_config.json');
var s3 = new AWS.S3();

// Protect all the rest of the requests starting with "/user" if the user doesn't have a token
USER_ROUTER.use('/user', function (req, res, next) {
    jwt.verify(req.query.token, 'secret', function (err, decodedToken) {
        if (err) {
            return res.status(401).json({
                message: 'No authentication',
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
    var token = jwt.decode(req.query.token);

    User.findById(token.id, function (err, user) {
        misc.checkUserErrors(err, res, user, token, () => {
            // Then, add the new one
            user.profilePicture = req.files[0].key;

            user.save(function (err, result) {
                if (err) {
                    return res.status(500).json({
                        message: 'problem saving user profile picture',
                        error: err
                    });
                }
                return res.status(200).json({
                    message: 'profile image updated',
                    data: req.files[0].key // file name
                });
            });
        });
    });
});

USER_ROUTER.get('/user/friend/:nickName', function (req, res) {
    var token = jwt.decode(req.query.token);
    User.findById(token.id, function (err, user) {
        misc.checkUserErrors(err, res, user, token, () => {

            let flag = false;
            for (let friend of user.following) {
                if (friend.nickName === req.params.nickName) {
                    flag = friend.accepted;
                    break;
                }
            }

            return res.status(200).json({
                message: 'flag',
                data: flag
            });
        });
    });
});

// isAdding expects true or false - Doesn't need authentication
USER_ROUTER.patch('/user/credit/:nickName/:isAdding/:credit', function (req, res) {
    // var token = jwt.decode(req.query.token);
    User.findOne({ nickName: req.params.nickName }, function (err, user) {
        misc.checkUserErrors(err, res, user, null, () => {
            // Create the field if not there
            if (!user.credit) {
                user['credit'] = 0;
            }

            if (req.params.isAdding === 'true') {
                user.credit += parseInt(req.params.credit);
            } else {
                user.credit -= parseInt(req.params.credit);
            }

            user.save(function (err, result) {
                if (err) {
                    return res.status(500).json({
                        message: 'problem updating credit',
                        error: err
                    });
                }
            });
        });
    });
});

// Add a complaint - !!! INVESTIGATE
USER_ROUTER.post('/user/complaint', function (req, res) {
    Room.findOne({ name: req.body.complaint.room.name }, (err, room) => {
        if (err || !room) {
            return res.status(404).json({
                message: 'Room not found',
                error: err
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
            if (err) {
                return res.status(500).json({
                    message: 'problem updating user',
                    error: err
                });
            }
        });

        User.find({ nickName: { $in: room.mods } }, { nickName: 1, complaintInbox: 1 }, (err, mods) => {
            if (err || !mods) {
                return res.status(404).json({
                    message: 'Mods not found',
                    error: err
                });
            }

            // Mods found, notify them - loop
            for (let i = 0; i < mods.length; i++) {
                var cb = () => { };
                if (i == mods.length - 1) {
                    cb = () => {
                        return res.status(200).json({
                            message: '',
                            data: ''
                        });
                    }
                }

                // !! Put this to a different inbox
                misc.notifyUsers(User, jwt.decode(req.query.token).id, req.body.complaint, mods[i].nickName, 'complaint', cb);
            }
        });
    });
});

USER_ROUTER.get('/user/complaints', (req, res) => {
    var token = jwt.decode(req.query.token);

    User.findById(token.id, (err, user) => {
        misc.checkUserErrors(err, res, user, token, () => {
            return res.status(200).json({
                message: 'complaints',
                data: user.complaintInbox
            });
        });
    });
});

USER_ROUTER.delete('/user/profilePicture', function (req, res) {
    var token = jwt.decode(req.query.token);

    User.findById(token.id, function (err, user) {
        misc.checkUserErrors(err, res, user, token, () => {
            // Delete it from S3 first!
            s3.deleteObject({
                Bucket: 'socialmediaimages2017',
                Key: 'user_images/' + user.profilePicture
            }, function (err, data) {
                if (err) {
                    return res.status(404).json({
                        message: 'Profile image not found!',
                        error: err
                    });
                }

                // Then empty users picture slot
                user.profilePicture = '';
                user.save(function (err, result) {
                    if (err) {
                        return res.status(500).json({
                            message: 'An error occured',
                            error: err
                        });
                    }
                    return res.status(200).json({
                        message: 'Profile image deleted!',
                        data: result
                    });
                });
            });
        });
    });
});

USER_ROUTER.post('/user/ban/:person/:days', function (req, res) {
    User.update(
        { nickName: req.params.person },
        { bannedChat: { isBanned: true, days: req.params.days, banDate: Date.now() } },
        function (err, result) {
            if (err) {
                return res.status(500).json({
                    message: 'problem banning person',
                    error: err
                })
            }
            return res.status(200).json({
                message: 'success',
                data: result
            });
        });
});

// Update cover picture
USER_ROUTER.post('/user/coverImage', upload.any(), function (req, res) {
    var token = jwt.decode(req.query.token);

    User.findById(token.id, function (err, user) {
        misc.checkUserErrors(err, res, user, token, () => {
            // Then, add the new one
            user.coverImage = req.files[0].key;

            user.save(function (err, result) {
                if (err) {
                    return res.status(500).json({
                        message: 'An error occured',
                        error: err
                    });
                }
                return res.status(200).json({
                    message: 'Cover image updated!',
                    data: req.files[0].key
                });
            });
        });
    });
});

USER_ROUTER.delete('/user/coverImage', function (req, res) {
    var token = jwt.decode(req.query.token);

    User.findById(token.id, function (err, user) {
        misc.checkUserErrors(err, res, user, token, () => {
            // Delete it from S3 first!
            s3.deleteObject({
                Bucket: 'socialmediaimages2017',
                Key: 'user_images/' + user.coverImage
            }, function (err, data) {
                if (err) {
                    return res.status(404).json({
                        message: 'Profile image not found!',
                        error: err
                    });
                }

                // Then empty users picture slot
                user.coverImage = '';
                user.save(function (err, result) {
                    if (err) {
                        return res.status(500).json({
                            message: 'An error occured',
                            error: err
                        });
                    }
                    return res.status(200).json({
                        message: 'Cover image deleted!',
                        data: result
                    });
                });
            });
        });
    });
});

// Upload multiple images
USER_ROUTER.post('/user/images', upload.any(), function (req, res) {
    var token = jwt.decode(req.query.token);

    User.findById(token.id, function (err, user) {
        misc.checkUserErrors(err, res, user, token, () => {
            if (req.files.length > 0) {
                for (let file of req.files) {
                    user.images.push(file.key);
                }
            }

            user.save(function (err, result) {
                if (err) {
                    return res.status(500).json({
                        message: 'An error occured',
                        error: err
                    });
                }
                return res.status(200).json({
                    message: 'User images updated!',
                    data: user.images
                });
            });
        });
    });
});

USER_ROUTER.delete('/user/images', function (req, res) {
    var token = jwt.decode(req.query.token);

    User.findById(token.id, function (err, user) {
        misc.checkUserErrors(err, res, user, token, () => {
            var fileToDelete = decodeURI(req.body.pictureToDelete.split('/user_images/')[1]);

            // Delete it from S3 first!
            s3.deleteObject({
                Bucket: 'socialmediaimages2017',
                Key: 'user_images/' + fileToDelete
            }, function (err, data) {
                if (err) {
                    return res.status(404).json({
                        message: 'Image to delete not found!',
                        error: err
                    });
                }

                let pos = user.images.indexOf(fileToDelete);
                user.images.splice(pos, 1);

                // Then empty users picture slot
                user.save(function (err, result) {
                    if (err) {
                        return res.status(500).json({
                            message: 'An error occured',
                            error: err
                        });
                    }

                    return res.status(200).json({
                        message: 'Profile image deleted!',
                        data: result
                    });
                });
            });
        });
    });
});

// Add a new user
USER_ROUTER.post('/', function (req, res, next) {
    var user = new User({
        nickName: req.body.nickName.toLowerCase(),
        email: req.body.email.toLowerCase(),
        password: bcrypt.hashSync(req.body.password, 10),
        credit: 100
    });

    user.save(function (err, result) {
        if (err) {
            return res.status(500).json({
                message: 'An error occured',
                error: err
            });
        }

        return res.status(201).json({
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
        misc.checkUserErrors(err, res, user, null, () => {
            if (!bcrypt.compareSync(req.body.password, user.password)) {
                return res.status(401).json({
                    message: 'Login failed',
                    error: 'Invalid credentials'
                });
            }

            // Create and send the token
            var token = jwt.sign({
                id: user._id
            }, 'secret', {
                    expiresIn: "1 day"
                });
            return res.status(200).json({
                message: 'Successfully logged in',
                data: {
                    token: token,
                    userId: user._id,
                    name: user.nickName,
                    credit: user.credit,
                    picture: user.profilePicture
                }
            });
        });
    });
});

// Update a user - Profile info
USER_ROUTER.patch('/user', function (req, res, next) {
    var token = jwt.decode(req.query.token);

    User.findById(token.id, function (err, user) {
        misc.checkUserErrors(err, res, user, token, () => {
            // Make them lower case for easy search purposes
            user.firstName = req.body.firstName;
            user.lastName = req.body.lastName;
            user.birthday = req.body.birthday;
            user.bio = req.body.bio;
            user.education = req.body.education;
            user.jobStatus = req.body.jobStatus;
            user.twitterLink = req.body.twitterLink;
            user.youtubeLink = req.body.youtubeLink;
            user.linkedinLink = req.body.linkedinLink;
            user.googleplusLink = req.body.googleplusLink;
            user.snapchatLink = req.body.snapchatLink;
            user.instagramLink = req.body.instagramLink;

            user.save(function (err, result) {
                if (err) {
                    return res.status(500).json({
                        message: 'An error occured',
                        error: err
                    });
                }
                return res.status(200).json({
                    message: 'User updated!',
                    data: result
                });
            });
        });
    });
});

// Get a user profile
USER_ROUTER.get('/user', function (req, res, next) {
    var token = jwt.decode(req.query.token);

    User.findById(token.id)
        .populate('following.friend', ['profilePicture'])
        .exec(function (err, user) {
            misc.checkUserErrors(err, res, user, token, () => {
                return res.status(200).json({
                    message: 'user profile',
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
            misc.checkUserErrors(err, res, user, null, () => {
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
                            message: 'error getting posts of profile',
                            error: err
                        });
                    }
                    user.posts = posts;

                    return res.status(200).json({
                        message: 'a user profile',
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
            misc.checkUserErrors(err, res, users, null, () => {
                return res.status(200).json({
                    message: 'users',
                    data: users
                });
            });
        });
});

// Get the requests of a user
USER_ROUTER.get('/user/requests/all/:offset', function (req, res) {
    var token = jwt.decode(req.query.token),
        offset = parseInt(req.params.offset);

    User.findById(token.id)
        .populate('following.friend', ['profilePicture'])
        .exec(function (err, data) {
            misc.checkUserErrors(err, res, data, token, () => {
                // sort skip etc here
                var result = data.following.reverse().slice(offset, offset + 5);
                return res.status(200).json({
                    message: 'requests',
                    data: result
                });
            });
        });
});

// Adds a user to a group
USER_ROUTER.post('/user/groups/:name/:friend', function (req, res) {
    var token = jwt.decode(req.query.token);

    // Find this user first
    User.findById(token.id, {
        groups: 1
    }, function (err, user) {
        misc.checkUserErrors(err, res, user, null, () => {
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
                        message: 'An error occured',
                        error: err
                    });
                }
                return res.status(200).json({
                    message: 'Group modified!',
                    data: result
                });
            });
        });
    });
});

// Delete a friend from a group
USER_ROUTER.delete('/user/groups/:groupName/:friend', function (req, res) {
    var token = jwt.decode(req.query.token);

    // // Find this user first
    User.findById(token.id, {
        groups: 1
    }, function (err, user) {
        misc.checkUserErrors(err, res, user, null, () => {
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
                        message: 'An error occured',
                        error: err
                    });
                }
                return res.status(200).json({
                    message: 'Group modified!',
                    data: result
                });
            });
        });
    });
});

// Adds a new user group
USER_ROUTER.post('/user/groups/:name', function (req, res) {
    var token = jwt.decode(req.query.token);

    // Find this user first
    User.findById(token.id, {
        groups: 1
    }, function (err, user) {
        misc.checkUserErrors(err, res, user, null, () => {
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
                        message: 'An error occured',
                        error: err
                    });
                }
                return res.status(200).json({
                    message: 'Group modified!',
                    data: result
                });
            });
        });
    });
});

// Gets all the user groups for a given user
USER_ROUTER.get('/user/groups/', function (req, res) {
    var token = jwt.decode(req.query.token);

    // Find this user first
    User.findById(token.id, {
        groups: 1
    }, function (err, user) {
        misc.checkUserErrors(err, res, user, token, () => {
            return res.status(200).json({
                message: 'groups',
                data: user.groups
            });
        });
    });
});

// Friend request only - Adds it to the receiver's request list
USER_ROUTER.post('/user/follow/:id', function (req, res) {
    var token = jwt.decode(req.query.token);

    // Find this user first
    User.findById(token.id, {
        nickName: 1, following: 1
    }, function (err, thisUser) {
        misc.checkUserErrors(err, res, thisUser, null, () => {
            // Find the other user
            User.findById(req.params.id, function (err, otherUser) {
                misc.checkUserErrors(err, res, otherUser, null, () => {

                    var canAdd = true;

                    // Send the request if it is not
                    for (let following of otherUser.following) {
                        // Is there my name on his/her list?
                        if (following.nickName == thisUser.nickName) {
                            canAdd = false;
                            break;
                        }
                    }

                    for (let following of thisUser.following) {
                        // Is there my name on his/her list?
                        if (following.nickName == otherUser.nickName) {
                            canAdd = false;
                            break;
                        }
                    }

                    if (canAdd) {
                        otherUser.following.push({
                            nickName: thisUser.nickName,
                            accepted: false,
                            message: '',
                            friend: token.id,
                            date: Date.now()
                        });

                        otherUser.save(function (err, result) {
                            if (err) {
                                return res.status(500).json({
                                    message: 'An error occured',
                                    error: err
                                });
                            }
                            return res.status(200).json({
                                message: 'Follow request sent!',
                                data: result
                            });
                        });
                    } else {
                        return res.status(500).json({
                            message: 'already',
                            error: ''
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
    var token = jwt.decode(req.query.token);

    // User - The one that is logged in
    User.findById(token.id, function (err, user) {
        misc.checkUserErrors(err, res, user, token, () => {
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
                        message: 'An error occured saving the logged in user',
                        error: err
                    });
                }

                // Other user - Friend to be
                User.findById(req.params.id, function (err, otherUser) {
                    misc.checkUserErrors(err, res, otherUser, null, () => {
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
                                    message: 'An error occured saving other user',
                                    error: err
                                });
                            }
                            return res.status(200).json({
                                message: 'Follow request accepted!',
                                data: result
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
    var token = jwt.decode(req.query.token);

    // User - The on that is logged in
    User.findById(token.id, function (err, user) {
        misc.checkUserErrors(err, res, user, token, () => {
            // Take it out from there
            for (let i = 0; i < user.following.length; i++) {
                if (user.following[i].nickName === req.params.name) {
                    user.following.splice(i, 1);
                }
            }

            user.save(function (err, result) {
                if (err) {
                    return res.status(500).json({
                        message: 'An error occured',
                        error: err
                    });
                }
                return res.status(200).json({
                    message: 'Follow request accepted!',
                    data: result
                });
            });
        });
    });
});

// Delete friends bi-directionally
USER_ROUTER.delete('/user/unfriend/:name', function (req, res) {
    var token = jwt.decode(req.query.token);
    var currentUser = '';
    var userToUnfriend = req.params.name;

    // User - The on that is logged in
    User.findById(token.id, function (err, user) {
        misc.checkUserErrors(err, res, user, token, () => {
            // Take it out from there
            for (let i = 0; i < user.following.length; i++) {
                if (user.following[i].nickName === req.params.name) {
                    user.following.splice(i, 1);
                }
            }

            user.save(function (err, result) {
                if (err) {
                    return res.status(500).json({
                        message: 'An error occured',
                        error: err
                    });
                }

                // Other user - Friend to be deleted
                User.findOne({
                    nickName: req.params.name
                }, function (err, otherUser) {
                    misc.checkUserErrors(err, res, user, null, () => {
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
                                    message: 'An error occured',
                                    error: err
                                });
                            }
                            return res.status(200).json({
                                message: 'Friend is gone!',
                                data: result
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
    var token = jwt.decode(req.query.token);

    // Find all the related messages
    Message.findById(req.params.id, {
        initiator: 1,
        initiated: 1,
        initiatorRead: 1,
        initiatedRead: 1
    }, function (err, message) {
        if (err) {
            return res.status(500).json({
                message: 'An error occured marking the message read',
                error: err
            });
        }

        if (!message) {
            return res.status(404).json({
                message: 'Message not found',
                error: err
            });
        }

        // Check who is reading the message, mark accordingly
        if (message.initiator.toString() === token.id) {
            message.initiatorRead = true;
        } else if (message.initiated.toString() === token.id) {
            message.initiatedRead = true;
        }

        message.save(function (err, result) {
            if (err) {
                return res.status(500).json({
                    message: 'problem saving message',
                    error: err
                });
            }
            return res.status(200).json({
                message: 'Message is marked read',
                data: result
            });
        });
    });
});

// Remove notification
USER_ROUTER.delete('/user/notifications/:id/:type/:user', function (req, res) {
    var token = jwt.decode(req.query.token);
    User.findById(jwt.decode(req.query.token).id, { inbox: 1 }, function (err, user) {
        misc.checkUserErrors(err, res, user, token, () => {
            for (let item = 0; item < user.inbox.length; item++) {
                if (user.inbox[item]._id.toString() == req.params.id) {
                    user.inbox.splice(item, 1);
                    break;
                }
            }

            user.save(function (err, result) {
                if (err) {
                    return res.status(500).json({
                        message: 'problem removing notification from user',
                        error: err
                    });
                }
                return res.status(200).json({
                    message: 'success',
                    data: result
                });
            });
        })
    });
});

USER_ROUTER.get('/user/notifications/:offset', function (req, res) {
    var token = jwt.decode(req.query.token),
        offset = parseInt(req.params.offset);

    User.findById(token.id)
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
            misc.checkUserErrors(err, res, user, token, () => {
                // Do the skip and limit here
                var result = user.inbox.reverse().slice(offset, offset + 5);

                return res.status(200).json({
                    message: 'notifications',
                    data: result
                });
            });
        });
});

// Checks if there is anything unread in a general level - Make this more specific later!
USER_ROUTER.get('/user/inbox', function (req, res) {
    var token = jwt.decode(req.query.token);
    var flag = false;

    // Check for unaccepted friend requests first
    User.findById(token.id, function (err, user) {
        misc.checkUserErrors(err, res, user, token, () => {
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

                user.save(function (err, result) {
                    if (err) {
                        return res.status(500).json({
                            message: 'problem saving user ban',
                            error: err
                        });
                    }
                });
            }

            // Find all the related messages
            Message.find({
                $or: [{
                    initiator: token.id
                }, {
                    initiated: token.id
                }]
            }, {
                    initiator: 1,
                    initiated: 1,
                    initiatorRead: 1,
                    initiatedRead: 1
                }, function (err, messages) {
                    if (err) {
                        return res.status(500).json({
                            message: 'An error occured find messages of users read',
                            error: err
                        });
                    }

                    if (messages.length > 0) {
                        for (let i = 0; i < messages.length; i++) {
                            // Decide if you are initiator or initiated
                            if (token.id === messages[i].initiator.toString()) {
                                if (messages[i].initiatorRead === false) {
                                    flag = true;
                                }
                            } else if (token.id === messages[i].initiated.toString()) {
                                if (messages[i].initiatedRead === false) {
                                    flag = true;
                                }
                            }
                        }
                    }

                    return res.status(200).json({
                        message: 'What is new in inbox',
                        data: {
                            flag: flag,
                            userSituation: user.bannedChat
                        }
                    });
                });
        });
    })
});

// Get inbox numbers
USER_ROUTER.get('/inbox/numbers', function (req, res) {
    var token = jwt.decode(req.query.token);

    User.findById(token.id, { inbox: 1, following: 1, credit: 1 }, function (err, user) {
        misc.checkUserErrors(err, res, user, token, () => {
            var requests = [];
            for (let i = 0; i < user.following.length; i++) {
                // There is a new, waiting request!
                if (user.following[i].accepted === false) {
                    requests.push(user.following[i]);
                }
            }

            Message.find({ $or: [{ initiator: token.id }, { initiated: token.id }] }, function (err, messages) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error with message numbers',
                        error: err
                    });
                }

                var numbers = {
                    requests: requests.length,
                    notifications: user.inbox.length,
                    messages: messages.length,
                    credit: user.credit
                }

                return res.status(200).json({
                    message: 'numbers',
                    data: numbers
                });
            });
        });
    });
});

module.exports = USER_ROUTER;