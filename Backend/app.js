var express = require('express'),
	logger = require('morgan'),
	bodyParser = require('body-parser'),
	mongoose = require('mongoose'),
	request = require('request'),
	helmet = require('helmet'),
	compression = require('compression'),
	https = require('https'),
	fs = require('fs'),
	RateLimit = require('express-rate-limit'),
	cache = require('express-redis-cache')(),
	expressSanitized = require('express-sanitize-escape');


// Load routes
var appRoutes = require('./routes/app'),
	postRoutes = require('./routes/post'),
	adRoutes = require('./routes/ad'),
	messageRoutes = require('./routes/message'),
	userRoutes = require('./routes/user'),
	chatRoutes = require('./routes/chat'),
	mailRoutes = require('./routes/mail');

var app = express();

var URL = "https://kutatku.com:3000/post/clean";
//var URL = "https://kutatku.com:3000/post/clean";

// Start database connection
// var mongoUrl = "mongodb://alikutluozen:alikutluozen@socialmediacluster-shard-00-00-u02gh.mongodb.net:27017,socialmediacluster-shard-00-01-u02gh.mongodb.net:27017,socialmediacluster-shard-00-02-u02gh.mongodb.net:27017/SocialMediaDB?ssl=true&replicaSet=SocialMediaCluster-shard-0&authSource=admin";
var mongoUrl = "mongodb://" + process.env.MONGOUSER + ":" + process.env.MONGOPASS + "@kutatku-shard-00-00-5i6jt.mongodb.net:27017,kutatku-shard-00-01-5i6jt.mongodb.net:27017,kutatku-shard-00-02-5i6jt.mongodb.net:27017/test?ssl=true&replicaSet=kutatku-shard-0&authSource=admin&retryWrites=true";

mongoose.Promise = global.Promise;
mongoose.connect(mongoUrl, { useMongoClient: true }, function (err) {
	if (err) console.log('PROBLEM CONNECTING TO MONGO', err);
	console.log('Connected to database!');
});

var limiter = new RateLimit({
	windowMs: 10 * 60 * 1000, // 10 minutes
	max: 1000, // limit each IP to 1000 requests per windowMs
	delayMs: 0, // disable delaying - full speed until the max limit is reached
	message: "IP rate limit exceeded!"
});

app.use(limiter);
app.use(helmet());
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(expressSanitized.middleware());
app.all('/*', function (req, res, next) {
	// var allowedOrigins = ['http://127.0.0.1', 'http://localhost', 'https://kutatku.com', 'https://www.kutatku.com'];
	// var origin = req.headers.origin;
	// if (allowedOrigins.indexOf(origin) > -1) {
	// 	res.header('Access-Control-Allow-Origin', origin);
	// }
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,PATCH,DELETE,OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, *');
	next();
});

cache.on('connected', function () {
	console.log('Connected to Redis server!');
});

cache.on('disconnected', function () {
	console.log('Disconnected from Redis server!');
});

app.use('/post', postRoutes);
app.use('/message', messageRoutes);
app.use('/user', userRoutes);
app.use('/chat', chatRoutes);
app.use('/mail', mailRoutes);
app.use('/ad', adRoutes);
app.use('/', appRoutes);

// Clean up old posts regularly
var requestLoop = setInterval(function () {
	request({
		url: URL,
		method: "GET",
		timeout: 10000,
		followRedirect: true,
		strictSSL: false,
		maxRedirects: 10
	}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log('cleaned it up!', body);
		} else {
			console.log('error, couldnt clean!', error, response, body);
		}
	});
}, 60000);

var privateKey = fs.readFileSync('/etc/ssl/kutatku.key', 'utf-8', function (err) {
	console.log('error loading private key');
});
var certificate = fs.readFileSync('/etc/ssl/kutatku_com.crt', 'utf-8', function (err) {
	console.log('error loading certificate');
});


https.createServer({
	key: privateKey,
	cert: certificate
}, app)
	.listen(3000, function (conn) {
		console.log('Server is listening on port 3000')
	});

module.exports = app;