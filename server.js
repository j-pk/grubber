var express = require('express');
var cors = require('cors')
var app = express()

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
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