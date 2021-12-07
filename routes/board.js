var express = require('express');
var boardRouter = express.Router();

  boardRouter.get('/', function(req, res, next) {
    res.render('mainBoard');
  });
  
  boardRouter.get('/seoulList', function(req, res, next) {
    res.render('seoulList');
  });
  
module.exports = boardRouter;