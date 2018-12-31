var express = require('express');
var POST_ROUTER = express.Router(),
    Post = require('../models/post'),
    jwt = require('jsonwebtoken'),
    User = require('../models/user'),
    async = require('async'),
    multer = require('multer'),
    multerS3 = require('multer-s3'),
    AWS = require('aws-sdk'),
    cache = require('express-redis-cache')({ expire: 60 }),
    misc = require('../misc');

// Handling image upload
AWS.config.loadFromPath('./s3_config.json');
var s3 = new AWS.S3();

// Multer middleware
var upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'kutatku/post_images',
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

// Have a function that checks every post date, and call this if it over certain date !!!!
POST_ROUTER.get('/clean', (req, res) => {
    Post.find({
        created: {
            // $lt: new Date(),
            $lt: new Date(new Date().setDate(new Date().getDate() - 60))
        },
        group: { $ne: 'private' }
    }, function (err, posts) {
        if (err) {
            return res.status(400).json({
                message: 'problem get posts',
                error: err
            })
        }

        // Found old posts, now delete them nicely in a loop.
        async.forEachOf(posts, (value, key, callback) => {
            Post.findOneAndRemove({ _id: value._id, nickName: { $ne: 'kutbot' } }, (err, post) => {
                if (err || !post) {
                    callback(err);
                } else {
                    // Delete it from everybody
                    User.find({ posts: { $in: [post._id] } }, { nickName: 1, posts: 1, inbox: 1 }, (err, users) => {
                        for (let user of users) {
                            user.posts.pull(post._id);
                            // Also delete from inbox
                            for (let i = 0; i < user.inbox.length; i++) {
                                if (user.inbox[i].post == post._id.toString()) {
                                    user.inbox.splice(i, 1);
                                    i--;
                                }
                            }

                            user.save(function (err) {
                                if (err) {
                                    return res.status(500).json({
                                        message: 'problem saving post to user',
                                        error: err
                                    })
                                }
                            });
                        }
                    });

                    // Handle the post picture too
                    if (post.image != '' && post.image != undefined) {
                        s3.deleteObject({
                            Bucket: 'kutatku',
                            Key: 'post_images/' + post.image
                        }, function (err, data) {
                            if (err) {
                                callback(err);
                            }
                        });
                    }
                    callback();
                }
            });
        }, err => {
            if (err) {
                return res.status(400).json({
                    message: 'not cleaned',
                    error: err
                });
            }
            // configs is now a map of JSON data
        });

        return res.status(200).json({
            message: 'cleaned',
            data: ''
        });
    })
});

// Get all subjects and group them
POST_ROUTER.get('/subjects', function (req, res) {
    Post.aggregate([
        {
            $match: {
                group: {
                    $ne: 'private'
                },
                subject: {
                    $ne: ['']
                }
            }
        },
        { $unwind: "$subject" },
        {
            $group: {
                _id: "$subject",
                count: {
                    $sum: 1
                },
            },
        },
        {
            $match: {
                count: {
                    $gte: 1
                }
            }
        },
        {
            $sort: { count: -1 }
        },
        {
            $limit: 15,
        },
        // Done! We successfully aggregated the top 10 subject names that appeared more than 10 times each!
    ], function (err, subjects) {
        // Handle the error
        if (err) {
            return res.status(500).json({
                message: 'An error occured when getting subjects',
                error: err
            });
        }

        // Successfully send it to the client
        return res.status(200).json({
            message: 'subjects',
            data: subjects
        });
    });
});

// Get only one post with all the info.
POST_ROUTER.get('/post/:id', cache.route(), function (req, res) {
    Post.findById(req.params.id)
        .populate([{
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
        }]).exec((err, post) => {
            if (err || !post) {
                return res.status(500).json({
                    message: 'problem getting post',
                    error: err
                });
            }
            return res.status(200).json({
                message: 'post',
                data: post
            });
        });
});

// Get shareable link
POST_ROUTER.get('/:id', function (req, res) {
    Post.findById(req.params.id)
        .populate([{
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
        }]).exec((err, post) => {
            if (err || !post) {
                return res.status(500).json({
                    message: 'problem getting post',
                    error: err
                });
            }
            return res.render('post', { user: post.nickName, message: post.content, picture: post.image });
        });
});

// Get all posts with a given subject
POST_ROUTER.get('/friends/:subject/:amount', function (req, res) {
    var token = jwt.decode(req.query.token);

    var amount = parseInt(req.params.amount);
    var theSubject = req.params.subject.toLowerCase();

    Post.find({ group: 'public', subject: theSubject }).sort({ created: 'desc' }).skip(amount).limit(5).populate([{
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
        if (err || !posts) {
            return res.status(500).json({
                message: 'problem finding subjects',
                error: err
            });
        }
        return res.status(200).json({
            message: 'posts',
            data: posts
        });
    });

    // // Get the user first
    // User.findById(token.id, function (err, user) {
    //     var finalResponse = misc.checkResultErrors(err, res, 'user', user);
    //     if (finalResponse) {
    //         return finalResponse;
    //     }
    //     // Temporary friends array
    //     var friends = [];

    //     // Put the user too so he/she can their own posts too
    //     if (req.params.subject.toString() === user._id.toString()) {
    //         friends.push(user.nickName);
    //         theSubject = '';
    //     } else {
    //         friends.push(user.nickName);
    //         for (friend of user.following) {
    //             if (friend.accepted == true) {
    //                 friends.push(friend.nickName);
    //             }
    //         }
    //     }

    //     // Find all the friends
    //     User.aggregate([
    //         { $match: { nickName: { $in: friends } } }, // Get all the friends
    //         { $project: { posts: 1, _id: 0 } }
    //     ]).exec(function (err, posts) {

    //         // List all the post ids
    //         var postIdArray = [];
    //         for (let inPosts of posts) {
    //             if (inPosts.posts.length > 0) {
    //                 for (let i = 0; i < inPosts.posts.length; i++) {
    //                     postIdArray.push(inPosts.posts[i]);
    //                 }
    //             }
    //         }

    //         if (theSubject != '') {
    //             Post.find({ group: 'public', subject: theSubject, _id: { $in: postIdArray } }).sort({ created: 'desc' }).skip(amount).limit(5).populate([{
    //                 path: 'user',
    //                 model: User,
    //                 select: 'nickName profilePicture'
    //             }, {
    //                 path: 'shares.user',
    //                 model: User,
    //                 select: 'nickName profilePicture'
    //             }, {
    //                 path: 'comments.user',
    //                 model: User,
    //                 select: 'nickName profilePicture'
    //             }]).exec(function (err, posts) {
    //                 if (err || !posts) {
    //                     return res.status(500).json({
    //                         message: 'problem finding subjects',
    //                         error: err
    //                     });
    //                 }
    //                 return res.status(200).json({
    //                     message: 'posts',
    //                     data: posts
    //                 });
    //             });
    //         } else {
    //             Post.find({ group: 'public', _id: { $in: postIdArray } }).sort({ created: 'desc' }).skip(amount).limit(5).populate([{
    //                 path: 'user',
    //                 model: User,
    //                 select: 'nickName profilePicture'
    //             }, {
    //                 path: 'shares.user',
    //                 model: User,
    //                 select: 'nickName profilePicture'
    //             }, {
    //                 path: 'comments.user',
    //                 model: User,
    //                 select: 'nickName profilePicture'
    //             }]).exec(function (err, posts) {
    //                 if (err || !posts) {
    //                     return res.status(500).json({
    //                         message: 'problem finding subjects',
    //                         error: err
    //                     });
    //                 }
    //                 return res.status(200).json({
    //                     message: 'posts',
    //                     data: posts
    //                 });
    //             });
    //         }
    //     });
    // });
});

// Get private posts
POST_ROUTER.get('/friends/:subject/:publicity/:amount/:person', function (req, res) {
    var token = jwt.decode(req.query.token);

    var amount = parseInt(req.params.amount);
    var publicity = req.params.publicity;

    var person = token.id;
    if (req.params.person) {
        person = req.params.person;
    }

    // Get the user first
    User.findById(person, function (err, user) {
        var finalResponse = misc.checkResultErrors(err, res, 'user', user);
        if (finalResponse) {
            return finalResponse;
        }

        Post.find({ nickName: user.nickName, group: 'private' }).sort({ created: 'desc' }).populate([{
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
            if (err || !posts) {
                return res.status(500).json({
                    message: 'problem getting private posts',
                    error: err
                });
            }
            return res.status(200).json({
                message: 'posts',
                data: posts
            });
        });
    });
});

// Get posts of friends
POST_ROUTER.get('/friends/:amount', function (req, res) {
    var token = jwt.decode(req.query.token);
    var amount = parseInt(req.params.amount);

    Post.find({ group: 'public' }).sort({ created: 'desc' }).skip(amount).limit(5).populate([{
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
        if (err || !posts) {
            return res.status(500).json({
                message: 'problem finding subjects',
                error: err
            });
        }
        return res.status(200).json({
            message: 'posts',
            data: posts
        });
    });

    // // Get the user first
    // User.findById(token.id, function (err, user) {
    //     var finalResponse = misc.checkResultErrors(err, res, 'user', user);
    //     if (finalResponse) {
    //         return finalResponse;
    //     }

    //     // Temporary friends array
    //     var friends = [];

    //     // Put the user too so he/she can their own posts too
    //     friends.push(user.nickName);
    //     for (friend of user.following) {
    //         if (friend.accepted == true) {
    //             friends.push(friend.nickName);
    //         }
    //     }

    //     // Find all the friends
    //     User.aggregate([
    //         { $match: { nickName: { $in: friends } } }, // Get all the friends
    //         { $project: { posts: 1, _id: 0 } }
    //     ]).exec(function (err, posts) {

    //         var postIdArray = [];
    //         for (let inPosts of posts) {
    //             if (inPosts.posts.length > 0) {
    //                 for (let i = 0; i < inPosts.posts.length; i++) {
    //                     postIdArray.push(inPosts.posts[i]);
    //                 }
    //             }
    //         }

    //         Post.find({ group: 'public', _id: { $in: postIdArray } }).sort({ created: 'desc' }).skip(amount).limit(5).populate([{
    //             path: 'user',
    //             model: User,
    //             select: 'nickName profilePicture'
    //         }, {
    //             path: 'shares.user',
    //             model: User,
    //             select: 'nickName profilePicture'
    //         }, {
    //             path: 'comments.user',
    //             model: User,
    //             select: 'nickName profilePicture'
    //         }]).exec(function (err, posts) {
    //             if (err || !posts) {
    //                 return res.status(500).json({
    //                     message: 'problem getting posts of friends',
    //                     error: err
    //                 });
    //             }
    //             return res.status(200).json({
    //                 message: 'posts',
    //                 data: posts
    //             });
    //         });
    //     });
    // });
});

// Protect the routes
// Each request this will execute
POST_ROUTER.use('/', function (req, res, next) {
    jwt.verify(req.query.token, process.env.SECRET, function (err, decodedToken) {
        if (err) {
            console.log('heyo');
            return res.status(401).json({
                message: 'No authentication',
                error: err
            });
        }
        next();
    });
});

// Upload a post image
POST_ROUTER.post('/image', upload.any(), function (req, res) {
    return res.status(200).json({
        message: 'Post image loaded!',
        data: req.files[0].key // file name
    });
});

POST_ROUTER.delete('/image', function (req, res) {

    var fileToDelete = decodeURI(req.body.pictureToDelete);

    // Also, somehow delete it in the post too, if exists!!!
    Post.findOne({ image: { $eq: fileToDelete } }, function (err, post) {
        if (err) {
            return res.status(500).json({
                message: 'problem getting post to delete image',
                error: err
            });
        }

        var filename = '';
        if (!post) {
            // post is not there yet, just gonna delete the image from s3
            filename = fileToDelete;
        } else {
            // post is there, find it by the filename
            filename = post.image;
        }

        // Either way, delete it
        s3.deleteObject({
            Bucket: 'kutatku',
            Key: 'post_images/' + filename
        }, function (err, data) {
            if (err) {
                return res.status(404).json({
                    message: 'Image to delete not found!',
                    error: err
                });
            }

            // If post exists, save with the new empty image
            if (post != null && post != undefined) {
                post.image = '';
                post.save(function (err, postResult) {
                    var finalResponse = misc.checkResultErrors(err, res, 'post', postResult);
                    if (finalResponse) {
                        return finalResponse;
                    }

                    return res.status(200).json({
                        message: 'Image deleted in the post!',
                        data: post
                    });
                });
            } else {
                return res.status(200).json({
                    message: 'Image deleted!',
                    data: data
                });
            }
        });
    });
});

// Add a new post
POST_ROUTER.post('/', function (req, res, next) {
    var token = jwt.decode(req.query.token);

    // Find the user first
    User.findById(token.id, function (err, user) {
        var finalResponse = misc.checkResultErrors(err, res, 'user', user);
        if (finalResponse) {
            return finalResponse;
        }

        // Temp subject patch - Fix this when the front end is fixed !!!
        var sbj = req.body.subject;
        if (sbj.length === 0) {
            sbj = [''];
        }

        // Create the post
        var post = new Post({
            content: req.body.content,
            subject: sbj,
            comments: [],
            likes: [],
            dislikes: [],
            shares: [],
            user: user,
            nickName: user.nickName,
            image: req.body.image,
            linkContent: req.body.linkContent,
            group: req.body.group
        });

        // Save it
        post.save(function (err, postResult) {
            var finalResponse = misc.checkResultErrors(err, res, 'post', postResult);
            if (finalResponse) {
                return finalResponse;
            }

            if (!postResult) {
                return;
            }

            user.posts.push(postResult.toObject());
            user.interaction.push(new Date());
            user.save(function (err, result) {
                if (err) {
                    return res.status(500).json({
                        message: 'An error occured saving message to user',
                        error: err
                    });
                }
                return res.status(201).json({
                    message: 'saved',
                    data: postResult
                });
            });
        });
    });
});

// Share a post
POST_ROUTER.post('/post/:id', function (req, res) {
    var token = jwt.decode(req.query.token);

    // Find the user first
    User.findById(token.id, function (err, user) {
        var finalResponse = misc.checkResultErrors(err, res, 'user', user);
        if (finalResponse) {
            return finalResponse;
        }

        // Find the post to add to user
        Post.findById(req.params.id, function (err, post) {
            var finalResponse = misc.checkResultErrors(err, res, 'post', post);
            if (finalResponse) {
                return finalResponse;
            }

            if (post) {
                // Add users name to the post
                post.shares.push({
                    user: user,
                    comment: req.body.comment
                });

                // Add the post to user's array like the user shared it
                user.posts.push(post);
                user.interaction.push(new Date());

                user.save(function (err, result) {
                    if (err) {
                        return res.status(500).json({
                            message: 'An error occured saving message to user',
                            error: err
                        });
                    }

                    // When saving the message, send the most up to date current user info
                    post.save(function (err, result) {
                        if (err) {
                            return res.status(500).json({
                                message: 'An error occured',
                                error: err
                            });
                        }

                        var currentUser = {
                            nickName: user.nickName,
                            profilePicture: user.profilePicture,
                            date: Date.now()
                        }

                        User.updateOne({ nickName: post.nickName }, {
                            $push: {
                                $position: 0,
                                inbox: {
                                    action: 'share',
                                    post: post._id,
                                    user: token.id,
                                    date: Date.now()
                                }
                            }
                        }, (err, user) => {
                            misc.checkUserErrors(err, res, user, null, () => {
                                return res.status(200).json({
                                    message: 'Post updated!',
                                    data: currentUser
                                });
                            });
                        });
                    });
                });
            }
        });
    });
});

// Add a comment to a post
POST_ROUTER.patch('/answer/:id', (req, res) => {
    req.body.user = jwt.decode(req.query.token).id;
    Post.findOneAndUpdate({ _id: req.params.id }, { $push: { comments: { $each: [req.body], $position: 0 } } }, (err, post) => {
        if (err || !post) {
            return res.status(500).json({
                message: 'problem adding a comment',
                error: err
            });
        }
        User.updateMany({ _id: { $in: [req.body.user, post.user] } }, { $push: { $position: 0, interaction: new Date() } }, (err) => {
            if (err) {
                return res.status(500).json({
                    message: 'problem adding an interaction',
                    error: err
                });
            }
        });
        misc.notifyUser(res, User, jwt.decode(req.query.token).id, post._id, post.nickName, 'comment');
    });
});

// Add a like to a post
POST_ROUTER.patch('/like/:id', (req, res) => {
    req.body.user = jwt.decode(req.query.token).id;
    Post.findOneAndUpdate({ _id: req.params.id }, { $push: { $position: 0, likes: req.body.name } }, { new: true }, (err, post) => {
        if (err || !post) {
            return res.status(500).json({
                message: 'problem adding a like',
                error: err
            });
        }
        User.updateMany({ _id: { $in: [req.body.user, post.user] } }, { $push: { $position: 0, interaction: new Date() } }, (err) => {
            if (err) {
                return res.status(500).json({
                    message: 'problem adding an interaction',
                    error: err
                });
            }
        });
        misc.notifyUser(res, User, jwt.decode(req.query.token).id, post._id, post.nickName, 'like');
    });
});

// Remove a like from the post
POST_ROUTER.delete('/like/:id/:name', (req, res) => {
    Post.findOneAndUpdate({ _id: req.params.id }, { $pull: { likes: { $in: [req.params.name] } } }, (err, post) => {
        if (err || !post) {
            return res.status(500).json({
                message: 'problem removing a like',
                error: err
            });
        }
        misc.removeNotification(res, User, jwt.decode(req.query.token).id, post._id, post.nickName, 'like');
    });
});

// Add a dislike to a post
POST_ROUTER.patch('/dislike/:id', (req, res) => {
    Post.findOneAndUpdate({ _id: req.params.id }, { $push: { $position: 0, dislikes: req.body.name } }, (err, post) => {
        if (err || !post) {
            return res.status(500).json({
                message: 'problem adding a dislike',
                error: err
            });
        }
        misc.notifyUser(res, User, jwt.decode(req.query.token).id, post._id, post.nickName, 'dislike');
    });
});

// Remove a dislike from the post
POST_ROUTER.delete('/dislike/:id/:name', (req, res) => {
    Post.findOneAndUpdate({ _id: req.params.id }, { $pull: { dislikes: { $in: [req.params.name] } } }, (err, post) => {
        if (err || !post) {
            return res.status(500).json({
                message: 'problem removing a dislike',
                error: err
            });
        }
        misc.removeNotification(res, User, jwt.decode(req.query.token).id, post._id, post.nickName, 'dislike');
    });
});

// Delete a comment from a post
POST_ROUTER.delete('/:id1/answer/:id2', (req, res) => {
    Post.findOneAndUpdate({ _id: req.params.id1 }, { $pull: { comments: { id: req.params.id2 } } }, (err, post) => {
        if (err || !post) {
            return res.status(500).json({
                message: 'problem deleting a comment',
                error: err
            });
        }
        misc.removeNotification(res, User, jwt.decode(req.query.token).id, post._id, post.nickName, 'comment');
    });
});

// Update a post
POST_ROUTER.patch('/:id', function (req, res) {
    var sbj = req.body.subject
    if (sbj.length === 0) {
        sbj = [''];
    }
    Post.updateOne({ _id: req.params.id }, {
        $set: {
            content: req.body.content,
            subject: sbj,
            image: req.body.image,
            linkContent: req.body.linkContent,
            group: req.body.group
        }
    }, (err, post) => {
        if (err || !post) {
            return res.status(500).json({
                message: 'problem updating a post',
                error: err
            });
        }
        return res.status(200).json({
            message: 'success',
            data: post
        });
    });
});

// Remove a post
POST_ROUTER.delete('/:id', (req, res) => {
    Post.findOneAndRemove({ _id: req.params.id }, (err, post) => {
        if (err || !post) {
            return res.status(500).json({
                message: 'problem removing a post',
                error: err
            });
        }

        // Delete it from everybody
        User.find({ posts: { $in: [post._id] } }, { nickName: 1, posts: 1, inbox: 1 }, (err, users) => {
            for (let user of users) {
                user.posts.pull(post._id);
                // Also delete from inbox
                for (let i = 0; i < user.inbox.length; i++) {
                    if (user.inbox[i].post == post._id.toString()) {
                        user.inbox.splice(i, 1);
                        i--;
                    }
                }

                user.save(function (err, result) {
                    if (err) {
                        return res.status(500).json({
                            message: 'problem saving a user when deleting a post',
                            error: err
                        });
                    }
                });
            }
        });

        // Handle the post picture too
        if (post.image != '' && post.image != undefined) {
            s3.deleteObject({
                Bucket: 'kutatku',
                Key: 'post_images/' + post.image
            }, function (err, data) {
                if (err) {
                    return res.status(500).json({
                        message: 'problem deleting a post image',
                        error: err
                    });
                }
            });
        }

        return res.status(200).json({
            message: 'success',
            data: post
        });
    });
});

// Remove a shared post
POST_ROUTER.delete('/post/:id', function (req, res, next) {
    var token = jwt.decode(req.query.token);

    // Find the user first
    User.findById(token.id, function (err, user) {
        var finalResponse = misc.checkResultErrors(err, res, 'user', user);
        if (finalResponse) {
            return finalResponse;
        }

        // Find the post to add to user
        Post.findById(req.params.id, function (err, post) {
            var finalResponse = misc.checkResultErrors(err, res, 'post', post);
            if (finalResponse) {
                return finalResponse;
            }

            // Remove the user from the post
            for (let i = 0; i < post.shares.length; i++) {
                if (post.shares[i].user.toString() == user._id) {
                    post.shares.splice(i, 1);
                }
            }

            // Remove the post from the user - Only if it is not the last original post!
            for (let i = 0; i < user.posts.length; i++) {
                if (user.posts[i].toString() == req.params.id) {
                    user.posts.splice(i, 1);
                    break;
                }
            }

            // Then save both
            user.save(function (err, result) {
                if (err) {
                    return res.status(500).json({
                        message: 'problem saving message to user',
                        error: err
                    });
                }

                post.save(function (err, result) {
                    if (err) {
                        return res.status(500).json({
                            message: 'problem saving a post',
                            error: err
                        });
                    }

                    User.updateOne({ nickName: post.nickName }, {
                        $pull: {
                            inbox: {
                                action: 'share',
                                post: post._id,
                                user: token.id,
                            }
                        }
                    }, (err, user) => {
                        misc.checkUserErrors(err, res, user, null, () => {
                            return res.status(200).json({
                                message: 'Post updated!',
                                data: result[result.length - 1]
                            });
                        });
                    });
                });
            });
        });
    });
});

module.exports = POST_ROUTER;