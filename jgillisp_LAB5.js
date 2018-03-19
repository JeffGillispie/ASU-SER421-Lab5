// ============================================================================
// SETUP
// ============================================================================
var fs = require('fs');
var http = require('http');
var url = require('url');
var qstring = require('querystring');
var ROOT_DIR = ".";
//var apiID = 'f9cd3610e9144f965638b5be216a0b1d';
var apiID = '7cd7d8a9ecd1cf937093689f7a20a860';
// ============================================================================
// FORMAT EXTENSION
// ============================================================================
String.prototype.format = function() {
  var args = [].slice.call(arguments);
  return this.replace(/(\{\d+\})/g, function (a) {
    return args[+(a.substr(1, a.length - 2))|0];
  });
}
// ============================================================================
// PARSE WEATHER
// ============================================================================
function parseWeather(weatherResponse, callback) {
  var weatherData = '';
  weatherResponse.on('data', function (chunk) {
    weatherData += chunk;
  });
  weatherResponse.on('end', function () {
    callback(weatherData);
  });
}
// ============================================================================
// GET WEATHER DATA
// ============================================================================
function getWeatherData(city, callback) {
  var queryType = 'weather';
  var query = '/data/2.5/{0}?q={1}&APPID={2}'.format(queryType, city, apiID);
  var options = {
    host: 'api.openweathermap.org',
    path: query
  };
  http.request(options, function(weatherResponse) {
    parseWeather(weatherResponse, callback);
  }).end();
}
// ============================================================================
// PROCESS GET METHOD
// ============================================================================
function processGetMethod(req, res) {
  var urlObj = url.parse(req.url, true, false);
  var filepath = (urlObj.pathname == '/') ? '/index.html' : urlObj.pathname;
  // get the target file
  fs.readFile(ROOT_DIR + filepath, function (err, data) {
    // error response
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    // send head
    if (req.url.endsWith('html')) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
    } else if (req.url.endsWith('js')) {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
    }
    // send response
    res.end(data);
  });
}
// ============================================================================
// PROCESS POST METHOD
// ============================================================================
function processPostMethod(req, res) {
  var reqData = '';
  req.on('data', function (chunk) {
    reqData += chunk;
  });
  req.on('end', function() {
    var postParams = qstring.parse(reqData);
    var city = postParams.city;
    console.log('Processing request for ' + city);
    getWeatherData(city, function(weatherData){
      res.end(weatherData);
    });
  });
}
// ============================================================================
// START SERVER
// ============================================================================
http.createServer(function (req, res) {
  console.log(req.method);
  if (req.method == "GET") {
    processGetMethod(req, res);
  } else if (req.method == "POST") {
    processPostMethod(req, res);
  } else {
    res.end('405 - Method not Allowed');
  }
}).listen(8080, 'localhost', 3, function() {
  console.log('Running on port 8080');
});
