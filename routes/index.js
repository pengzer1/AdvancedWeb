var express = require('express');
var router = express.Router();
var mysql = require('mysql2');
var models = require('../models');
var crypto = require('crypto');
var sequelize = require('sequelize');
var Op = sequelize.Op;

var client = mysql.createConnection({
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: '1234',
  database: 'neighbor',
  multipleStatements: true
})

client.connect(e => {
  if (e) {
      throw e
  }
  console.log('mysql running')
})

let session;
let searchWord;
let searchRange;
/* GET home page. */
router.get('/', function(req, res, next) {
  session = req.session;
  res.render('index', { title: 'Neighbor', session: session });
});

// 로그인 GET
router.get('/sign_in', function(req, res, next){
  res.render("sign_in", {
      session : session
  });
});
// 로그인 POST
router.post("/sign_in", async function(req,res,next){
  let body = req.body;

  let result = await models.user.findOne({
      where: {
          email : body.email
      }
  });
  if(result === null){
    console.log("아이디 불일치");
    res.redirect("/sign_in");
  }
  else{  
    let dbPassword = result.dataValues.pw;
    let inputPassword = body.pw;
    let salt = result.dataValues.salt;
    let hashPassword = crypto.createHash("sha512").update(inputPassword + salt).digest("hex");
    let dbName = result.dataValues.name;
  
    if(dbPassword === hashPassword){
        console.log("비밀번호 일치");
        // 세션 설정
        models.user.findAll({ where: {email: result.email}}).then(result => {
          req.session.name = result;
        })
        req.session.name = dbName;
        req.session.email = body.email;
        req.session.phone = result.dataValues.phone;
        req.session.birth = result.dataValues.birth;
        req.session.postcode = result.dataValues.postcode;
        req.session.modifyAddress = result.dataValues.modifyAddress;
        req.session.detailAddress = result.dataValues.detailAddress;
        res.redirect('/');
    }
    else{
        console.log("비밀번호 불일치");
        res.redirect("/sign_in");
    }
  }
});

router.route('/logout').get(                      //설정된 쿠키정보를 본다
  function (req, res) {
      console.log('/loginout 라우팅 함수호출 됨');

      if (req.session.email) {
          console.log('로그아웃 처리');
          req.session.destroy(
              function (err) {
                  if (err) {
                      console.log('세션 삭제시 에러');
                      return;
                  }
                  console.log('세션 삭제 성공');
                  res.clearCookie('sid');
                  //파일 지정시 제일 앞에 / 를 붙여야 root 즉 public 안에서부터 찾게 된다
                  res.redirect('/');
              }
          );          //세션정보 삭제

      } else {
          console.log('로긴 안되어 있음');
          res.redirect('/sign_in');
      }
  }
);

router.get('/sign_up', function(req, res, next){
    res.render('sign_up', { session: session});
});

//회원가입 Form
router.post('/sign_up', function(req, res, next) {
  let body = req.body;

  let inputPassword = body.pw;
  let salt = Math.round((new Date().valueOf() * Math.random())) + "";
  let hashpw = crypto.createHash("sha512").update(inputPassword + salt).digest("hex");

  let result = models.user.create({
    name: body.name,
    email: body.email,
    pw: hashpw,
    phone: body.phone,
    birth: body.birth,
    postcode: body.postcode,
    modifyAddress: body.modifyAddress,
    detailAddress: body.detailAddress,
    salt: salt
  })

  res.redirect("/sign_in");
});



router.get('/mainBoard', function(req, res, next){
  var sql = "select id, listName, name, title, date_format(createdAt,'%Y-%m-%d') createdAt from texts where listName = '취미' or listName = '낙서장' or listName = '핫추' or listName = '고민상담소'";
  client.query(sql, function (err, rows) {
    if (err) console.error(err);
        client.query("select count(*) as count from texts where listName = '취미' or listName = '낙서장' or listName = '핫추' or listName = '고민상담소'" , (countQueryErr, countQueryResult) => {
          if (countQueryErr) console.error("err : " + countQueryErr);
          res.render('mainBoard', {rows: rows, length:countQueryResult[0].count, session:session});
        });
  });
        
});

//글 상세보기
router.get('/textForm/:whe/:id',function(req,res,next)
{
var id = req.params.id;
var whe = req.params.whe;
    var sql = "select id, name, title, input from texts where id=?";
    client.query(sql,[id], function(err,row)
    {
      if(err) console.error(err);
        client.query("select * from cmts where textId='"+id+"'", function(selErr, selRes){
          if(selErr) console.error(selErr);
            res.render('textForm', {row:row[0], session:session, cmt:selRes, where:whe, id:id});
        });
  });
});
//Text 수정 이동
router.get('/editText/:whe/:id/modify', function(req,res,next) {
  var id = req.params.id;
  var whe = req.params.whe;

  var sql = "select id, name, title, input from texts where id=?";
  client.query(sql, [id], function(err,row) {
    if(err) console.error(err);
    res.render('editText', {row:row[0], where: whe, session: session, id: id});
  });
});
//Text 삭제 기능
router.post('/delText', async function(req, res, next) {
  let body = req.body;

  let result = await models.texts.findAll({
    where: {
      name: session.name
    }
  });

  if(result === null){
    console.log("없음");
  }
  else{
    console.log("있음");

    models.texts.destroy({where: { name: session.name, title: body.title, input: body.input}});
    res.redirect("/list/"+ body.whe + "/1");
  }
});

//페이징
router.get('/list/:whe/:page',function(req,res,next)
{
    var whe = req.params.whe;
    var page = req.params.page;
    var sql = "select id, name, title, input, date_format(createdAt,'%Y-%m-%d') createdAt from texts where listName = '" + whe + "'";
    client.query(sql, function (err, rows) {
        if (err) console.error(err);
        client.query("select count(*) as count from texts where listName= '"+whe+"'" , (countQueryErr, countQueryResult) => {
          if (countQueryErr) console.error("err : " + countQueryErr);
          res.render('seoulList', {rows: rows, page:page, length:countQueryResult[0].count, page_num:8, pass:true, where:whe, session:session, search: false});
        });
        
    });
});
//검색
router.post('/list/:whe/search/', function(req,res,next){
  let body = req.body;
  let whe = req.params.whe;
  let page = 1;
  searchWord = body.searchWord;
  searchRange = body.searchRange;

    var sql = "select id, name, title, input, date_format(createdAt,'%Y-%m-%d') createdAt from texts where "+ searchRange +" LIKE '%" + searchWord + "%' AND listName = '" + whe + "'";
    client.query(sql, function (err, rows) {
      if(err) console.error(err);
      client.query("select count(*) as count from texts where "+ searchRange +" LIKE '%"+searchWord+"%' AND listName = '" + whe + "'", (countQueryErr, countQueryResult) => {
        if(countQueryErr) console.error("err : " + countQueryErr);
        res.render('seoulList',{rows: rows, page:page, length:countQueryResult[0].count, page_num:8, pass:true, where:whe, session:session, search: true});
      });
    });
});
//검색후 페이징
router.get('/list/:whe/search/:page', function(req,res,next){
  let whe = req.params.whe;
  let page = req.params.page;
  console.log(searchRange);
  console.log(searchWord);
    var sql = "select id, name, title, input, date_format(createdAt,'%Y-%m-%d') createdAt from texts where "+ searchRange +" LIKE '%" + searchWord + "%' AND listName = '" + whe + "'";
    client.query(sql, function (err, rows) {
      if(err) console.error(err);
      client.query("select count(*) as count from texts where "+ searchRange +" LIKE '%"+searchWord+"%' AND listName = '" + whe + "'", (countQueryErr, countQueryResult) => {
        if(countQueryErr) console.error("err : " + countQueryErr);
        res.render('seoulList',{rows: rows, page:page, length:countQueryResult[0].count, page_num:8, pass:true, where:whe, session:session, search: true});
      });
    });
});

router.get('/map', function(req, res, next){
  res.render('map', { session: session });
});
router.get('/chat', function(req, res, next){
  res.render('chat', { session: session });
});
//editText
router.get('/editText/:whe', function(req, res, next){
  let whe = req.params.whe;
  let row = -1;
  res.render('editText', {where: whe, row:row, session:session});
});
//마이페이지 내가 쓴 글
router.get('/myPage/:page', function(req,res,next){
    var page = req.params.page;
    var sql = "select id, name, title, listName, input, date_format(createdAt,'%Y-%m-%d') createdAt from texts where name = '" + session.name + "'";
    client.query(sql, function (err, rows) {
        if (err) console.error(err);
        client.query("select count(*) as count from texts where name= '"+session.name+"'" , (countQueryErr, countQueryResult) => {
          if (countQueryErr) console.error("err : " + countQueryErr);
          res.render('myPage', {rows: rows, page:page, length:countQueryResult[0].count, page_num:8, pass:true, session:session});
        });
        
    });
});
router.get('/delId', function(req,res,next){
  res.render('delId', {session:session});
});
router.get('/profile', function(req,res,next){
  res.render('profile', {session:session});
});
//editText 수정 Post 부분
router.post('/mod/:whe', function(req, res, next) {
  let body = req.body;
  let whe = req.params.whe;

  models.texts.update({
    title: body.title,
    input: body.input,
  }, {where: {id: body.id}});
  res.redirect("/textForm/"+whe+"/"+body.id);
  next();
});
//editText Post 부분
router.post('/edt/:whe', function(req, res, next) {
  let body = req.body;
  let whe = req.params.whe;
  let name = session.name;

  models.texts.create({
    listName: body.listName,
    name: name,
      title: body.title,
      input: body.input
  })
      .then( result => {
          console.log("데이터 추가 완료");
          res.redirect("/list/"+whe+"/1");
      })
      .catch( err => {
          console.log("데이터 추가 실패");
      })
});
//댓글 달기
router.post('/createCmt/:whe/:id', function(req, res, next){
  let where = req.params.whe;
  let id = req.params.id;
  let body = req.body;
  models.cmts.create({
    textId: id,
    name: body.nickName,
    content: body.content
  }).then( result =>{
    console.log("댓글 추가 완료");
    res.redirect("/textForm/"+where+"/"+id);
  })
  .catch( err => {
    console.log("댓글 추가 실패");
  })
});
//댓글 삭제
router.post('/deleteCmt/:whe/:id', async function(req,res,next){
  let where = req.params.whe;
  let id = req.params.id;
  let body = req.body;

  let result = await models.cmts.findOne({ where: { id: body.id, textId: id, name: body.name, content: body.content }});
  if(result === null) console.log("값 없음");
  else{
    console.log("값 있음");
    models.cmts.destroy({ where: { id: body.id, textId: id, name: body.name, content: body.content }});
    res.redirect('/textForm/' + where + '/' + id);
  }
});

router.get('/pwConfirm', function(req, res, next){
  res.render('pwConfirm', { session: session });
});
//마이페이지 비밀번호 확인
router.post('/pwConfirm', async function(req, res, next){
  let body = req.body;

  let result = await models.user.findOne({
    where: {
      email: session.email
    }
  });
  if(result === null){
    console.log("빈칸");
  }
  else{
    console.log("값 있음");
    let dbPassword = result.dataValues.pw;
    let inputPassword = body.pw;
    let salt = result.dataValues.salt;
    let hashPassword = crypto.createHash("sha512").update(inputPassword + salt).digest("hex");

    if(dbPassword === hashPassword){
      console.log("비밀번호 일치");
      res.redirect("/myPage/1");
    }
    else{
      console.log("비밀번호 불일치");
      res.redirect("/pwConfirm");
    }
  }
});

router.get('/profile', function(req, res, next){
  res.render('profile', {rows: rows, session: session, data: data});
});
//프로필 변경 기능
router.post('/profile', async function(req, res, next){
  let body = req.body;

  let result = await models.user.findOne({
    where: {
        email : session.email
    }});
    if(result === null){
    }
    else{
      let inputPassword = body.pw;
      let salt = result.dataValues.salt;
      let hashPassword = crypto.createHash("sha512").update(inputPassword + salt).digest("hex");

      models.user.update({pw: hashPassword, phone: body.phone, birth: body.birth, postcode: body.postcode, modifyAddress: body.modifyAddress, detailAddress: body.detailAddress},{where : { email: session.email }});

      res.redirect('/');
    }
});

router.get('/delId', function(req, res, next){
  res.render('delId', { session: session });
});
//회원탈퇴 기능
router.post('/delId', async function(req, res, next){
  let body = req.body;

  let result = await models.user.findOne({
    where: {
      email: session.email
    }
  });
  if(result === null){
    console.log("빈칸");
  }
  else{
    console.log("값 있음");
    let dbPassword = result.dataValues.pw;
    let inputPassword = body.pw;
    let salt = result.dataValues.salt;
    let hashPassword = crypto.createHash("sha512").update(inputPassword + salt).digest("hex");

    if(dbPassword === hashPassword){
      console.log("비밀번호 일치");
      models.user.destroy({where: {email: session.email}});

          req.session.destroy(
              function (err) {
                  if (err) {
                      console.log('세션 삭제시 에러');
                      return;
                  }
                  console.log('세션 삭제 성공');
                  res.clearCookie('sid');
                  //파일 지정시 제일 앞에 / 를 붙여야 root 즉 public 안에서부터 찾게 된다
                  res.redirect('/');
              }
          );          //세션정보 삭제
    }
    else{
      console.log("비밀번호 불일치");
      res.redirect("/delId");
    }
  }
});

module.exports = router;
