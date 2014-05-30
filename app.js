// This is the main file of the chat app 
// Start the application by running 'node app.js'


var express = require('express'),
    app = express();


// This is needed if the app is run on Heroku
var port = process.env.PORT || 8080;


// Initialize a new socket.io object bound to the express app
var io = require('socket.io').listen(app.listen(port));


// Require the configuration and the routes files
// Pass the app and io as arguments to the returned functions
require('./config')(app, io);
require('./routes')(app, io);
