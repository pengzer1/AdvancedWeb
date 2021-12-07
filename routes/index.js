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
router.get('/seoulList', function(req, res, next){
  res.render('seoulList');
});
router.get('/textForm', function(req, res, next){
  res.render('textForm');
});
router.get('/map', function(req, res, next){
  res.render('map');
});
router.get('/chat', function(req, res, next){
  res.render('chat');
});
router.get('/editText', function(req, res, next){
  res.render('editText');
});
router.get('/myPage', function(req, res, next){
  res.render('myPage');
});
router.get('/profile', function(req, res, next){
  res.render('profile');
});
router.get('/delId', function(req, res, next){
  res.render('delId');
});

module.exports = router;
