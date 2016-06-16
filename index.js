
var http = require('http');
var url = require('url');
var atob = require('atob');
var fs = require("fs");
var uuid = require("uuid");

var pageSessions = [];

var server = http.createServer(function(client_req, client_res) {

  console.log('Doing some king of magic for the URL: ' + client_req.url);

  var query = url.parse(client_req.url, true).query;

  if (client_req.url == "/") {

    fs.readFile('src/static/index.html', 'binary', function(err, file) {
      if (err) {
        client_res.writeHead(500, {"Content-Type": "text/plain"});
        client_res.write(err + "\n");
        client_res.end();
        return;
      }

      client_res.writeHead(200);
      client_res.write(file, "binary");
      client_res.end();
    });

  } else if (query.jsessionid) {

    var requestUrl = atob(atob(query.jsessionid));
    var sessionId = uuid.v4();

    pageSessions.push({
      sessionId: sessionId,
      requestUrl: requestUrl
    });

    console.log('pageSessions: ' + JSON.stringify(pageSessions));

    var proxy = http.request(requestUrl, function (res) {
      res.pipe(client_res, {
        end: true
      });
    });

    proxy.on("error", function(err) {
      console.log("Error on proxy");
      console.log(err);
    });

    var pipe = client_req.pipe(proxy, {
      end: true
    });

    pipe.on("error", function(err) {
      console.log("Error on pipe");
      console.log(err);
    });

  } else if (client_req.url == "/favicon.ico") {
    client_res.end();

  } else {
    var queryInternal = url.parse(client_req.headers.referer, true).query;
    var jsessionIdInternal = queryInternal.jsessionid;

    jsessionIdInternal = atob(atob(jsessionIdInternal));

    console.log("referer " + jsessionIdInternal + client_req.url);

    var proxy = http.request(jsessionIdInternal + client_req.url, function (res) {
      res.pipe(client_res, {
        end: true
      });
    });

    proxy.on("error", function(err) {
      console.log("Error on proxy");
      console.log(err);
    });

    var pipe = client_req.pipe(proxy, {
      end: true
    });

    pipe.on("error", function(err) {
      console.log("Error on pipe");
      console.log(err);
    });

  }

});

//var port = Number(process.env.PORT || 3000);
var port = Number(process.env.PORT || 8092);

console.log("The port is: " + port);

server.listen(port);
