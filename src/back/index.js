
var http = require('http');
var url = require('url');
var atob = require('atob');
var fs = require("fs");

var server = http.createServer(function(client_req, client_res) {

  console.log('Doing some king of magic for the URL: ' + client_req.url);

  var query = url.parse(client_req.url, true).query;

  if (query.jsessionid) {

    var requestUrl = atob(atob(query.jsessionid));

    console.log('requestUrl: ' + requestUrl);

    var proxy = http.request(requestUrl, function (res) {
      res.pipe(client_res, {
        end: true
      });
    });

    console.log("\n\n\n\n### PROXY: " + proxy)

    proxy.on("error", function(err) {
      console.log("Error on proxy");
      console.log(err);
    });

    var pipe = client_req.pipe(proxy, {
      end: true
    });

    console.log("\n\n\n\n### PIPE: " + pipe)

    pipe.on("error", function(err) {
      console.log("Error on pipe");
      console.log(err);
    });

  } else if (client_req.url.indexOf('index.html') > -1 || !client_req.url) {
    console.log('I want the start page, please.');

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
  }

});

var port = Number(process.env.PORT || 3000);

console.log("The port is: " + port);

server.listen(port);
