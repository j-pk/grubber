var express = require('express');
var port = process.env.PORT || 3000;
var express = require('express');
var app = express();
//Middleware
app.listen();

app.get('/', function(request, response) {
    response.sendfile(__dirname + '/index.html');
}).configure(function() {
    app.use('/images', express.static(__dirname + '/images'));
}).listen(port);