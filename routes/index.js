var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var models = require('../models');
var crypto = require('crypto');

var client = mysql.createConnection({
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: 'ckalswo6312!',
  database: 'neighbor',
  multipleStatements: true
})

client.connect(e => {
  if (e) {
      throw e
  }
  console.log('mysql running')
})

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

//회원가입 Form
router.post('/sign_up', function(req, res, next) {
  let body = req.body;

  models.user.create({
    name: body.name,
    email: body.email,
    pw: body.pw,
    phone: body.phone,
    birth: body.birth,
    postcode: body.postcode,
    modifyAddress: body.modifyAddress,
    detailAddress: body.detailAddress
  })
      .then( result => {
          console.log("데이터 추가 완료");
          res.redirect("/sign_in");
      })
      .catch( err => {
          console.log("데이터 추가 실패");
      })
});


router.get('/mainBoard', function(req, res, next){
  res.render('mainBoard');
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

//editText Post 부분
router.post('/editText', function(req, res, next) {
  let body = req.body;

  models.text.create({
    listName: body,listName,
      name: body.name,
      input: body.input
  })
      .then( result => {
          console.log("데이터 추가 완료");
          res.redirect("/seoulList");
      })
      .catch( err => {
          console.log("데이터 추가 실패");
      })
});
module.exports = router;
