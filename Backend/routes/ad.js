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
        bucket: 'socialmediaimages2017/ad_images',
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

// Upload a post image
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

        // Create the post
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

// Get ads
AD_ROUTER.get('/:amount', function (req, res) {
    var token = jwt.decode(req.query.token);
    var amount = parseInt(req.params.amount);

    Ad.find({}, function (err, ads) {
        if (err) {
            return res.status(500).json({
                message: 'An error occured saving ad',
                error: err
            });
        }
        console.log(ads)
    })
});

module.exports = AD_ROUTER;