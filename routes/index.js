var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/sign_in', function(req, res, next){
  res.render('sign_in');
});
router.get('/sign_up', function(req, res, next){
  res.render('sign_up');
});
router.get('/mainBoard', function(req, res, next){
  res.render('mainBoard');
});
router.get('/seoulList', function(req, res, next){
  res.render('seoulList');
});
router.get('/chat', function(req, res, next){
  res.render('chat');
});
router.get('/editText', function(req, res, next){
  res.render('editText');
});


module.exports = router;
