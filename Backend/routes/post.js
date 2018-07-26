var express = require('express');
var POST_ROUTER = express.Router(),
    Post = require('../models/post'),
    jwt = require('jsonwebtoken'),
    User = require('../models/user'),
    async = require('async');

var multer = require('multer'),
    multerS3 = require('multer-s3'),
    AWS = require('aws-sdk');

var misc = require('../misc');

// Handling image upload
AWS.config.loadFromPath('./s3_config.json');
var s3 = new AWS.S3();

// Multer middleware
var upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'socialmediaimages2017/post_images',
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
            $lt: new Date(new Date().setDate(new Date().getDate() - 1))
        }
    }, function (err, posts) {
        if (err) {
            return res.status(400).json({ msg: err })
        }

        // Found old posts, now delete them nicely in a loop.
        async.forEachOf(posts, (value, key, callback) => {
            Post.findOneAndRemove({ _id: req.params.id }, (err, post) => {
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
                                    console.log('found one! at ', i);
                                    user.inbox.splice(i, 1);
                                    i--;
                                }
                            }
    
                            user.save();
                        }
                    });
    
                    // Handle the post picture too
                    if (post.image != '' && post.image != undefined) {
                        s3.deleteObject({
                            Bucket: 'socialmediaimages2017',
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
            if (err) console.error(err.message);
            // configs is now a map of JSON data
        });

        
        // request({
        //     uri: "http://127.0.0.1:3000/post/",
        //     method: "DELETE",
        //     timeout: 10000,
        //     followRedirect: true,
        //     maxRedirects: 10
        // }, function (error, response, body) {
        //     return res.status(200).json(body);
        // });
    })
});

// Get all subjects and group them
POST_ROUTER.get('/subjects', function (req, res) {
    Post.aggregate([
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
            $limit: 10,
        },
        // Done! We successfully aggregated the top 10 subject names that appeared more than 10 times each!
    ], function (err, subjects) {
        // Handle the error
        if (err) {
            return res.status(500).json({
                title: 'An error occured when getting subjects',
                error: err
            });
        }

        // Successfully send it to the client
        res.status(200).json(subjects);
    });
});

// Protect the routes
// Each request this will execute
POST_ROUTER.use('/', function (req, res, next) {
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

// Get all posts with a given subject
POST_ROUTER.get('/friends/:subject/:amount', function (req, res) {
    var decoded = jwt.decode(req.query.token);

    var amount = parseInt(req.params.amount);
    var theSubject = req.params.subject.toLowerCase();

    // Get the user first
    User.findById(decoded.id, function (err, user) {
        misc.checkResultErrors(err, user, 'user', res);
        // Temporary friends array
        var friends = [];

        // Put the user too so he/she can their own posts too
        if (req.params.subject.toString() === user._id.toString()) {
            friends.push(user.nickName);
            theSubject = '';
        } else {
            friends.push(user.nickName);
            for (friend of user.following) {
                if (friend.accepted == true) {
                    friends.push(friend.nickName);
                }
            }
        }

        // Find all the friends
        User.aggregate([
            { $match: { nickName: { $in: friends } } }, // Get all the friends
            { $project: { posts: 1, _id: 0 } }
        ]).exec(function (err, posts) {

            // List all the post ids
            var postIdArray = [];
            for (let inPosts of posts) {
                if (inPosts.posts.length > 0) {
                    for (let i = 0; i < inPosts.posts.length; i++) {
                        postIdArray.push(inPosts.posts[i]);
                    }
                }
            }

            if (theSubject != '') {
                Post.find({ group: 'public', subject: theSubject, _id: { $in: postIdArray } }).sort({ created: 'desc' }).skip(amount).limit(5).populate([{
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
                        return res.status(500).json({});
                    }
                    return res.status(200).json(posts);
                });
            } else {
                Post.find({ group: 'public', _id: { $in: postIdArray } }).sort({ created: 'desc' }).skip(amount).limit(5).populate([{
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
                        return res.status(500).json({});
                    }
                    return res.status(200).json(posts);
                });
            }
        });
    });
});

// Get only one post with all the info.
POST_ROUTER.get('/post/:id', function (req, res) {
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
            if (err || !post) res.status(500).json({});
            res.status(200).json(post);
        });
});

// Get private posts
POST_ROUTER.get('/friends/:subject/:publicity/:amount/:person', function (req, res) {
    var decoded = jwt.decode(req.query.token);

    var amount = parseInt(req.params.amount);
    var publicity = req.params.publicity;

    var person = decoded.id;
    if (req.params.person) {
        person = req.params.person;
    }

    // Get the user first
    User.findById(person, function (err, user) {
        misc.checkResultErrors(err, user, 'user', res);

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
                return res.status(500).json({});
            }
            return res.status(200).json(posts);
        });
    });
});

// Get posts of friends
POST_ROUTER.get('/friends/:amount', function (req, res) {
    var decoded = jwt.decode(req.query.token);

    var amount = parseInt(req.params.amount);

    // Get the user first
    User.findById(decoded.id, function (err, user) {
        misc.checkResultErrors(err, user, 'user', res);

        // Temporary friends array
        var friends = [];

        // Put the user too so he/she can their own posts too
        friends.push(user.nickName);
        for (friend of user.following) {
            if (friend.accepted == true) {
                friends.push(friend.nickName);
            }
        }

        // Find all the friends
        User.aggregate([
            { $match: { nickName: { $in: friends } } }, // Get all the friends
            { $project: { posts: 1, _id: 0 } }
        ]).exec(function (err, posts) {

            var postIdArray = [];
            for (let inPosts of posts) {
                if (inPosts.posts.length > 0) {
                    for (let i = 0; i < inPosts.posts.length; i++) {
                        postIdArray.push(inPosts.posts[i]);
                    }
                }
            }

            Post.find({ group: 'public', _id: { $in: postIdArray } }).sort({ created: 'desc' }).skip(amount).limit(5).populate([{
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
                    return res.status(500).json({});
                }
                return res.status(200).json(posts);
            });
        });
    });
});

// Upload a post image
POST_ROUTER.post('/image', upload.any(), function (req, res) {
    res.status(200).json({
        message: 'Post image loaded!',
        fileName: req.files[0].key
    });
});

POST_ROUTER.delete('/image', function (req, res) {

    var fileToDelete = decodeURI(req.body.pictureToDelete);

    // Also, somehow delete it in the post too, if exists!!!
    Post.findOne({ image: { $eq: fileToDelete } }, function (err, post) {
        if (err) {
            console.log('error in finding the post with image');
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
            Bucket: 'socialmediaimages2017',
            Key: 'post_images/' + filename
        }, function (err, data) {
            if (err) {
                res.status(404).json({
                    message: 'Image to delete not found!'
                });
            } else {

                // If post exists, save with the new empty image
                if (post != null && post != undefined) {
                    post.image = '';
                    post.save(function (err, postResult) {
                        misc.checkResultErrors(err, postResult, 'post', res);

                        res.status(200).json({
                            message: 'Image deleted in the post!',
                        });
                    });
                } else {

                    res.status(200).json({
                        message: 'Image deleted!',
                        location: ''
                    });
                }
            }
        });
    });
});

// Add a new post
POST_ROUTER.post('/', function (req, res, next) {
    var decoded = jwt.decode(req.query.token);

    // Find the user first
    User.findById(decoded.id, function (err, user) {
        misc.checkResultErrors(err, user, 'user', res);

        // Temp subject patch - Fix this when the front end is fixed !!!
        var sbj = req.body.subject;
        if (sbj.length === 0) {
            sbj = ['genel'];
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
            misc.checkResultErrors(err, postResult, 'post', res);

            // Also save to users array
            user.posts.push(postResult.toObject());
            user.save(function (err, result) {
                if (err) {
                    console.log('ERROR', err);
                    return res.status(500).json({
                        title: 'An error occured saving message to user',
                        error: err
                    });
                }
                res.status(201).json(postResult);
            });
        });
    });
});

// Share a post
POST_ROUTER.post('/post/:id', function (req, res) {
    var decoded = jwt.decode(req.query.token);

    // Find the user first
    User.findById(decoded.id, function (err, user) {
        misc.checkResultErrors(err, user, 'user', res);

        // Find the post to add to user
        Post.findById(req.params.id, function (err, post) {
            misc.checkResultErrors(err, post, 'post', res);

            // Add users name to the post
            post.shares.push({
                user: user,
                comment: req.body.comment
            });

            // Add the post to user's array like the user shared it
            user.posts.push(post);

            user.save(function (err, result) {
                if (err) {
                    return res.status(500).json({
                        title: 'An error occured saving message to user',
                        error: err
                    });
                }

                // When saving the message, send the most up to date current user info
                post.save(function (err, result) {
                    if (err) {
                        return res.status(500).json({
                            title: 'An error occured',
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
                                user: decoded.id,
                                date: Date.now()
                            }
                        }
                    }, (err, user) => {
                        if (err || !user) res.status(500).json({});
                        res.status(200).json({
                            message: 'Post updated!',
                            obj: currentUser
                        });
                    });
                });
            });
        });
    });
});

// Add a comment to a post
POST_ROUTER.patch('/answer/:id', (req, res) => {
    req.body.user = jwt.decode(req.query.token).id;
    console.log(req.params.id);
    Post.findOneAndUpdate({ _id: req.params.id }, { $push: { comments: { $each: [req.body], $position: 0 } } }, (err, post) => {
        if (err || !post) res.status(500).json({}); else
            misc.notifyUser(res, User, jwt.decode(req.query.token).id, post._id, post.nickName, 'comment');
    });
});

// Add a like to a post
POST_ROUTER.patch('/like/:id', (req, res) => {
    Post.findOneAndUpdate({ _id: req.params.id }, { $push: { $position: 0, likes: req.body.name } }, { new: true }, (err, post) => {
        if (err || !post) res.status(500).json({}); else
            misc.notifyUser(res, User, jwt.decode(req.query.token).id, post._id, post.nickName, 'like');
    });
});

// Remove a like from the post
POST_ROUTER.delete('/like/:id/:name', (req, res) => {
    Post.findOneAndUpdate({ _id: req.params.id }, { $pull: { likes: { $in: [req.params.name] } } }, (err, post) => {
        if (err || !post) res.status(500).json({}); else
            misc.removeNotification(res, User, jwt.decode(req.query.token).id, post._id, post.nickName, 'like');
    });
});

// Add a dislike to a post
POST_ROUTER.patch('/dislike/:id', (req, res) => {
    Post.findOneAndUpdate({ _id: req.params.id }, { $push: { $position: 0, dislikes: req.body.name } }, (err, post) => {
        if (err || !post) res.status(500).json({}); else
            misc.notifyUser(res, User, jwt.decode(req.query.token).id, post._id, post.nickName, 'dislike');
    });
});

// Remove a dislike from the post
POST_ROUTER.delete('/dislike/:id/:name', (req, res) => {
    Post.findOneAndUpdate({ _id: req.params.id }, { $pull: { dislikes: { $in: [req.params.name] } } }, (err, post) => {
        if (err || !post) res.status(500).json({}); else
            misc.removeNotification(res, User, jwt.decode(req.query.token).id, post._id, post.nickName, 'dislike');
    });
});

// Delete a comment from a post
POST_ROUTER.delete('/:id1/answer/:id2', (req, res) => {
    Post.findOneAndUpdate({ _id: req.params.id1 }, { $pull: { comments: { id: req.params.id2 } } }, (err, post) => {
        if (err || !post) res.status(500).json({}); else
            misc.removeNotification(res, User, jwt.decode(req.query.token).id, post._id, post.nickName, 'comment');
    });
});

// Update a post
POST_ROUTER.patch('/:id', function (req, res) {
    var sbj = req.body.subject;
    if (sbj.length === 0) {
        sbj = ['genel'];
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
        err || !post ? res.status(500).json({}) : res.status(200).json({});
    });
});

// Remove a post
POST_ROUTER.delete('/:id', (req, res) => {
    Post.findOneAndRemove({ _id: req.params.id }, (err, post) => {
        if (err || !post) {
            res.status(500).json({});
        } else {
            // Delete it from everybody
            User.find({ posts: { $in: [post._id] } }, { nickName: 1, posts: 1, inbox: 1 }, (err, users) => {
                for (let user of users) {
                    user.posts.pull(post._id);
                    // Also delete from inbox
                    for (let i = 0; i < user.inbox.length; i++) {
                        if (user.inbox[i].post == post._id.toString()) {
                            console.log('found one! at ', i);
                            user.inbox.splice(i, 1);
                            i--;
                        }
                    }

                    user.save();
                }
            });

            // Handle the post picture too
            if (post.image != '' && post.image != undefined) {
                s3.deleteObject({
                    Bucket: 'socialmediaimages2017',
                    Key: 'post_images/' + post.image
                }, function (err, data) {
                    if (err) {
                        console.log(err);
                    }
                });
            }

            res.status(200).json({});
        }
    });
});

// Remove a shared post
POST_ROUTER.delete('/post/:id', function (req, res, next) {
    var decoded = jwt.decode(req.query.token);

    // Find the user first
    User.findById(decoded.id, function (err, user) {
        misc.checkResultErrors(err, user, 'user', res);

        // Find the post to add to user
        Post.findById(req.params.id, function (err, post) {
            misc.checkResultErrors(err, post, 'post', res);

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
                        title: 'An error occured saving message to user',
                        error: err
                    });
                }

                post.save(function (err, result) {
                    if (err) {
                        return res.status(500).json({
                            title: 'An error occured',
                            error: err
                        });
                    }

                    User.updateOne({ nickName: post.nickName }, {
                        $pull: {
                            inbox: {
                                action: 'share',
                                post: post._id,
                                user: decoded.id,
                            }
                        }
                    }, (err, user) => {
                        if (err || !user) res.status(500).json({});
                        res.status(200).json({
                            message: 'Post updated!',
                            obj: result[result.length - 1]
                        });
                    });
                });
            });
        });
    });
});

module.exports = POST_ROUTER;