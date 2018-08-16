var express = require('express'),
    logger = require('morgan'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    request = require('request'),
    helmet = require('helmet'),
    compression = require('compression'),
    RateLimit = require('express-rate-limit'),
    expressSanitized = require('express-sanitize-escape');

// Load routes
var appRoutes = require('./routes/app'),
    postRoutes = require('./routes/post'),
    messageRoutes = require('./routes/message'),
    userRoutes = require('./routes/user'),
    chatRoutes = require('./routes/chat'),
    mailRoutes = require('./routes/mail');

var app = express();

var URL = "http://127.0.0.1:3000/post/clean"

// Start database connection
var mongoUrl = "mongodb://alikutluozen:alikutluozen@socialmediacluster-shard-00-00-u02gh.mongodb.net:27017,socialmediacluster-shard-00-01-u02gh.mongodb.net:27017,socialmediacluster-shard-00-02-u02gh.mongodb.net:27017/SocialMediaDB?ssl=true&replicaSet=SocialMediaCluster-shard-0&authSource=admin";
mongoose.Promise = global.Promise;
mongoose.connect(mongoUrl, { useMongoClient: true });

var limiter = new RateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    delayMs: 0, // disable delaying - full speed until the max limit is reached
    message: "IP rate limit exceeded!"
});

app.use(limiter);
app.use(helmet());
app.use(logger('dev'));
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressSanitized.middleware());
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
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
        url: URL,
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