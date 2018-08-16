var express = require('express'),
    jwt = require('jsonwebtoken'),
    nodemailer = require('nodemailer'),
    User = require('../models/user'),
    bcrypt = require('bcryptjs'),
    misc = require('../misc')
RateLimit = require('express-rate-limit');

// Handle limit
var limiter = new RateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // limit each IP to 1000 requests per windowMs
    delayMs: 0, // disable delaying - full speed until the max limit is reached
    message: "IP rate limit exceeded!"
});

require("dotenv").config();

var EMAIL_ROUTER = express.Router();
EMAIL_ROUTER.use('/', limiter);

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.USER,
        pass: process.env.PASS
    }
});

// Set a random password for someone and send them an email about it
EMAIL_ROUTER.post('/reset', function (req, res) {
    User.findOne({
        email: req.body.email
    }, function (err, user) {
        misc.checkUserErrors(err, res, user, null, () => {
            // Set a random code
            var randomCode = (Math.floor(Math.random() * 999999) + 100000).toString();

            // Save it on user and email it to user
            user.passwordReset = randomCode;
            user.save(function (err) {
                if (err) {
                    return res.status(502).json({
                        message: 'Problem saving user random password',
                        error: err
                    });
                }

                var mailOptions = {
                    from: process.env.USER,
                    to: req.body.email,
                    subject: 'Sifre yenileme - Ortam Online',
                    text: 'Sifreyi yenilemek icin lutfen bu kodu giriniz: ' + randomCode
                };

                transporter.sendMail(mailOptions, function (err, info) {
                    if (err) {
                        return res.status(400).json({
                            message: 'problem',
                            error: err
                        });
                    } else {
                        return res.status(200).json({
                            message: 'success',
                            data: info
                        });
                    }
                });
            });
        });
    });
});

EMAIL_ROUTER.post('/reset/new', function (req, res) {
    User.findOne({
        email: req.body.email
    }, function (err, user) {
        misc.checkUserErrors(err, res, user, null, () => {
            if (user.passwordReset == req.body.code) {
                user.password = bcrypt.hashSync(req.body.newPassword, 10);
                user.save(function (err) {
                    if (err) {
                        return res.status(400).json({
                            message: 'Problem saving user new password',
                            error: err
                        });
                    }

                    var mailOptions = {
                        from: process.env.USER,
                        to: req.body.email,
                        subject: 'Sifre yenileme - Ortam Online',
                        text: 'Sifreniz yenilenmistir!'
                    };

                    transporter.sendMail(mailOptions, function (err, info) {
                        if (err) {
                            return res.status(400).json({
                                message: 'problem',
                                error: err
                            });
                        } else {
                            return res.status(200).json({
                                message: 'success',
                                data: info
                            });
                        }
                    });
                });
            } else {
                return res.status(400).json({
                    message: 'no match',
                    error: 'no match'
                });
            }
        });
    });
});

EMAIL_ROUTER.post('/error', function (req, res) {
    console.error(req.body);
    return res.status(200).json({
        message: 'success',
        data: ''
    });
});

EMAIL_ROUTER.post('/message', function (req, res) {
    User.find({ nickName: req.body.nickName }, { email: 1 }, function (err, user) {
        misc.checkUserErrors(err, res, user, null, () => {
            var mailOptions = {
                from: process.env.USER,
                to: 'ali_kutluozen@hotmail.com',
                subject: req.body.messageType + ' from ' + req.body.nickName,
                text: req.body.message + '\n\n Contact ID: ' + user
            };

            transporter.sendMail(mailOptions, function (err, info) {
                if (err) {
                    return res.status(400).json({
                        message: 'problem',
                        error: err
                    });
                } else {
                    return res.status(200).json({
                        message: 'success',
                        data: info
                    });
                }
            });
        });
    })
});

module.exports = EMAIL_ROUTER;