var express = require('express');
var AD_ROUTER = express.Router(),
    jwt = require('jsonwebtoken'),
    User = require('../models/user'),
    Ad = require('../models/ad'),
    async = require('async'),
    multer = require('multer'),
    multerS3 = require('multer-s3'),
    AWS = require('aws-sdk'),
    misc = require('../misc');

// Handling image upload
AWS.config.loadFromPath('./s3_config.json');
var s3 = new AWS.S3();

// Multer middleware
var upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'socialmediaimages2017/classified_images',
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

// Protect the routes
// Each request this will execute
AD_ROUTER.use('/', function (req, res, next) {
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

// Upload a ad image
AD_ROUTER.post('/image', upload.any(), function (req, res) {
    return res.status(200).json({
        message: 'Ad image loaded!',
        data: req.files[0].key // file name
    });
});

// Add a new ad
AD_ROUTER.post('/', function (req, res, next) {
    var token = jwt.decode(req.query.token);

    User.findById(token.id, function (err, user) {
        var finalResponse = misc.checkResultErrors(err, res, 'user', user);
        if (finalResponse) {
            return finalResponse;
        }

        // Create the ad
        var ad = new Ad({
            content: req.body.content,
            title: req.body.title,
            category: req.body.category,
            picture: req.body.picture,
            user: user,
            nickName: user.nickName
        });

        // Save it
        ad.save(function (err, adResult) {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    message: 'An error occured saving ad',
                    error: err
                });
            }
            return res.status(201).json({
                message: 'saved',
                data: adResult
            });
        });
    });
});

// Update a post
AD_ROUTER.patch('/:id', function (req, res) {
    console.log('hereee', req);
    Ad.updateOne({ _id: req.params.id }, {
        $set: {
            content: req.body.content,
            category: req.body.category,
            picture: req.body.picture,
            title: req.body.title
        }
    }, (err, ad) => {
        if (err || !ad) {
            return res.status(500).json({
                message: 'problem updating an ad',
                error: err
            });
        }
        return res.status(200).json({
            message: 'success',
            data: ad
        });
    });
});


AD_ROUTER.delete('/image', function (req, res) {

    var fileToDelete = decodeURI(req.body.pictureToDelete);
    console.log('here');
    // Also, somehow delete it in the ad too, if exists!!!
    Ad.findOne({ picture: { $eq: fileToDelete } }, function (err, ad) {
        if (err) {
            return res.status(500).json({
                message: 'problem getting ad to delete image',
                error: err
            });
        }

        var filename = '';
        if (!ad) {
            // post is not there yet, just gonna delete the image from s3
            filename = fileToDelete;
        } else {
            // post is there, find it by the filename
            filename = ad.picture;
        }
        console.log('delete this\n\n', filename);
        // Either way, delete it
        s3.deleteObject({
            Bucket: 'socialmediaimages2017',
            Key: 'classified_images/' + filename
        }, function (err, data) {
            if (err) {
                return res.status(404).json({
                    message: 'Image to delete not found!',
                    error: err
                });
            }

            // If ad exists, save with the new empty image
            if (ad != null && ad != undefined) {
                ad.picture = '';
                ad.save(function (err, adResult) {
                    var finalResponse = misc.checkResultErrors(err, res, 'ad', adResult);
                    if (finalResponse) {
                        return finalResponse;
                    }

                    return res.status(200).json({
                        message: 'Image deleted in the post!',
                        data: ad
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


// Remove an ad
AD_ROUTER.delete('/:id', (req, res) => {
    Ad.findOneAndRemove({ _id: req.params.id }, (err, ad) => {
        if (err || !ad) {
            return res.status(500).json({
                message: 'problem removing a ad',
                error: err
            });
        }

        // Handle the post picture too
        if (ad.picture != '' && ad.picture != undefined) {
            s3.deleteObject({
                Bucket: 'socialmediaimages2017',
                Key: 'classified_images/' + ad.picture
            }, function (err, data) {
                if (err) {
                    return res.status(500).json({
                        message: 'problem deleting ad image',
                        error: err
                    });
                }
            });
        }

        return res.status(200).json({
            message: 'ad deleted',
            data: ''
        });
    });
});


// Get ads
AD_ROUTER.get('/:amount/:category', function (req, res) {
    var token = jwt.decode(req.query.token);

    var amount = parseInt(req.params.amount);
    var theCategory = req.params.category.toLowerCase();

    Ad.find({ category: theCategory }).sort({ created: 'desc' }).skip(amount).limit(5).populate([{
        path: 'user',
        model: User,
        select: 'nickName profilePicture'
    }]).exec(function (err, ads) {
        if (err || !ads) {
            return res.status(500).json({
                message: 'problem finding ads',
                error: err
            });
        }
        return res.status(200).json({
            message: 'ads',
            data: ads
        });
    });
});

module.exports = AD_ROUTER;