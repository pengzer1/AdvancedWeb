var express = require('express');
var boardRouter = express.Router();

  boardRouter.get('/', function(req, res, next) {
    res.render('mainBoard');
  });

module.exports = boardRouter;