var http = require('http');
var fs = require('fs');
var app = http.createServer(function(request,response){
    var url = request.url;
    if(url == '/'){
      url = '/main.html';
    }
    else if(url == '/sign_up.html'){
        url = '/sign_up.html';
    }
    else if(url == '/sign_in.html'){
        url = '/sign_in.html';
    }
    else if(url == '/mainBoard.html'){
        url = '/mainBoard.html';
    }
    else if(url == '/seoulList.html'){
        url = '/seoulList.html'
    }
    else if(url == '/map.html'){
        url = '/map.html'
    }
    if(url == 'favicon.ico'){
        return response.writeHead(404);
    }
    response.writeHead(200);
    response.end(fs.readFileSync(__dirname + url));

});
app.listen(3000);