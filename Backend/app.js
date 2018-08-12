var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var request = require('request');

// Load routes
var appRoutes = require('./routes/app');
var postRoutes = require('./routes/post');
var messageRoutes = require('./routes/message');
var userRoutes = require('./routes/user');
var chatRoutes = require('./routes/chat');
var mailRoutes = require('./routes/mail');

var app = express();

// Start database connection
var mongoUrl = "mongodb://alikutluozen:alikutluozen@socialmediacluster-shard-00-00-u02gh.mongodb.net:27017,socialmediacluster-shard-00-01-u02gh.mongodb.net:27017,socialmediacluster-shard-00-02-u02gh.mongodb.net:27017/SocialMediaDB?ssl=true&replicaSet=SocialMediaCluster-shard-0&authSource=admin";
mongoose.connect(mongoUrl);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PATCH, DELETE, OPTIONS');
    next();
});

app.use('/post', postRoutes);
app.use('/message', messageRoutes);
app.use('/user', userRoutes);
app.use('/chat', chatRoutes);
app.use('/mail', mailRoutes);
app.use('/', appRoutes);

// Clean up old posts regularly
var requestLoop = setInterval(function () {
    request({
        // url: "http://18.217.236.111:3000/post/clean",
        url: "http://127.0.0.1:3000/post/clean",
        method: "GET",
        timeout: 10000,
        followRedirect: true,
        maxRedirects: 10
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log('cleaned it up!', body);
        } else {
            console.log('error, couldnt clean!' + response);
        }
    });
}, 60000);

app.listen(3000);

module.exports = app;