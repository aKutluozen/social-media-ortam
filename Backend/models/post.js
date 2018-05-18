var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('../models/user');

var multer = require('multer'),
    multerS3 = require('multer-s3'),
    AWS = require('aws-sdk');

// Handling image upload
AWS.config.loadFromPath('./s3_config.json');
var s3 = new AWS.S3();

// Multer middleware
var upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'socialmediaimages2017/post_images',
        metadata: function(req, file, cb) {
            cb(null, {
                fieldName: file.fieldname
            });
        },
        key: function(req, file, cb) {
            cb(null, Date.now().toString() + file.originalname)
        }
    })
});

var schema = new Schema({
    content: { type: String, required: true },
    subject: [],
    created: { type: Date, default: Date.now },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    nickName: { type: String },
    comments: [{
        id: { type: String },
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        answer: { type: String },
        date: { type: Date, default: Date.now }
    }],
    likes: [],
    dislikes: [],
    shares: [{
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        comment: { type: String },
        date: { type: Date, default: Date.now }
    }],
    image: { type: String },
    linkContent: { type: String },
    group: { type: String }
});

module.exports = mongoose.model('Post', schema);