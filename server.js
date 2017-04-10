var express = require('express');
var cors = require('cors')
var app = express()

app.use(function(req, res, next) {
  var allowedOrigins = ['http://127.0.0.1:8020', 'http://localhost:8020', 'http://127.0.0.1:9000', 'http://localhost:9000'];
  var origin = req.headers.origin;
  if(allowedOrigins.indexOf(origin) > -1){
       res.setHeader('Access-Control-Allow-Origin', origin);
  }
  //res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:8020');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', true);
  return next();
});

var port = process.env.PORT || 8080;

app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/'));

app.get('/', function(req, res) {
    res.render('index');
});

app.listen(port, function() {
    console.log('App is running on http://localhost:' + port);
});