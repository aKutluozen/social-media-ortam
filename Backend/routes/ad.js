var express = require('express');
var AD_ROUTER = express.Router(),
    jwt = require('jsonwebtoken'),
    User = require('../models/user'),
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

module.exports = AD_ROUTER;