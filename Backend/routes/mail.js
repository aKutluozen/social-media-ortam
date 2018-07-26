var express = require('express'),
    jwt = require('jsonwebtoken'),
    nodemailer = require('nodemailer'),
    User = require('../models/user'),
    bcrypt = require('bcryptjs'),
    misc = require('../misc');

require("dotenv").config();

var EMAIL_ROUTER = express.Router();

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
        misc.checkUserErrors(res, err, user, null, () => {
            // Set a random password
            var randomCode = (Math.floor(Math.random() * 999999) + 100000).toString();

            // Save it on user and email it to user
            user.passwordReset = randomCode;
            user.save(function (err) {
                if (err) {
                    return res.status(400).json({
                        title: 'Problem saving user random password',
                        error: err
                    });
                }

                var mailOptions = {
                    from: process.env.USER,
                    to: req.body.email,
                    subject: 'Sifre yenileme - Ortam Online',
                    text: 'Sifreyi yenilemek icin lutfen bu kodu giriniz: ' + randomCode
                };

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        return res.status(400).json({
                            msg: 'problem'
                        });
                    } else {
                        return res.status(200).json({
                            msg: 'success'
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
        misc.checkUserErrors(res, err, user, null, () => {
            if (user.passwordReset == req.body.code) {
                user.password = bcrypt.hashSync(req.body.newPassword, 10);
                user.save(function (err) {
                    if (err) {
                        return res.status(400).json({
                            title: 'Problem saving user new password',
                            error: err
                        });
                    }

                    var mailOptions = {
                        from: process.env.USER,
                        to: req.body.email,
                        subject: 'Sifre yenileme - Ortam Online',
                        text: 'Sifreniz yenilenmistir!'
                    };

                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            return res.status(400).json({
                                msg: 'problem'
                            });
                        } else {
                            return res.status(200).json({
                                msg: 'success'
                            });
                        }
                    });
                });
            } else {
                return res.status(400).json({
                    msg: 'no match'
                });
            }
        });
    });
})

module.exports = EMAIL_ROUTER;