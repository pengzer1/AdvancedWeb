var express = require('express');
var router = express.Router();
var mysql = require('mysql2');
var models = require('../models');
var crypto = require('crypto');
var sequelize = require('sequelize');
var fs = require('fs');
var multer = require('multer');
var path = require('path');
var Op = sequelize.Op;
var fs = require('fs');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images/');
  },
  filename: function(req,file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, path.basename(file.originalname, ext) + '-' + Date.now() + ext);
  }
});

var upload = multer({ storage: storage });

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
let mail = 0;
let searchWord;
let searchRange;
/* GET home page. */
router.get('/', function(req, res, next) {
  session = req.session;
  console.log(mail);
  res.render('index', { title: 'Neighbor', session: session, mail: mail});
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
        req.session.image = result.dataValues.image;
        req.session.name = dbName;
        req.session.email = body.email;
        req.session.phone = result.dataValues.phone;
        req.session.birth = result.dataValues.birth;
        req.session.postcode = result.dataValues.postcode;
        req.session.modifyAddress = result.dataValues.modifyAddress;
        req.session.detailAddress = result.dataValues.detailAddress;
        client.query("select count(*) as count from sms where toWho='"+req.session.name+"' and stat='no'", function(countErr, countResult){
          if (countErr) console.error("err : " + countErr);
          mail=countResult[0].count;
          console.log(mail);
          res.redirect('/');
        });
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
router.post('/sign_up', upload.single('image'), function(req, res, next) {
  let body = req.body;
  let image = '/images/'+ req.file.filename;
  let inputPassword = body.pw;
  let salt = Math.round((new Date().valueOf() * Math.random())) + "";
  let hashpw = crypto.createHash("sha512").update(inputPassword + salt).digest("hex");

  models.user.create({
    image: image,
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
//지도
router.get('/map', function(req, res, next){
  fs.readFile('./data.json', 'utf8', function (err, data){
    let rData = JSON.parse(data);
    res.render('map', { session: session, rData });
  });
});
//쪽지 페이지
router.get('/smsPopup/:who', function(req,res,next){
  let who = req.params.who;
  res.render('smsPopup', {session:session, who:who});
});
//쪽지 post
router.post('/sendSms/:to/:from', function(req,res,next){
  let body = req.body;
  let toWho = req.params.to;
  let fromWho = req.params.from;

  models.sms.create({
    toWho: toWho,
    fromWho: fromWho,
    cont: body.input,
    stat: "no"
  })
      .then( result => {
          console.log("데이터 추가 완료");
          res.redirect("/mainBoard");
      })
      .catch( err => {
          console.log("데이터 추가 실패");
      })
});
//쪽지 삭제
router.get('/delMsg/:id', function(req, res, next){
  let id = req.params.id;
  models.sms.destroy({where: {id: id}});
  res.redirect("/message/1");
});

router.get('/message/:page', function(req,res,next){
  var page = req.params.page;
  client.query("select count(*) as count from sms where toWho='"+req.session.name+"' and stat='no'", function(countErr, countResult){
    if (countErr) console.error("err : " + countErr);
    mail=countResult[0].count;
    console.log(mail);
  });
  var sql = "select id, fromWho, cont, date_format(createdAt,'%Y-%m-%d') createdAt, stat from sms where toWho = '" + session.name + "'";
  client.query(sql, function (err, rows) {
    if (err) console.error(err);
    client.query("select count(*) as count from sms where toWho= '"+session.name+"'" , (countQueryErr, countQueryResult) => {
      if (countQueryErr) console.error("err : " + countQueryErr);
      res.render('message', {rows: rows, page:page, length:countQueryResult[0].count, page_num:8, pass:true, session:session, search: false, mail: mail});
    });
    
});
});
router.get('/readMsg/:who/:id', function(req,res,next){
  var id = req.params.id;
  var who = req.params.who;
  client.query("select * from sms where id='"+id+"'", (err, row) =>{
    if (err) console.error(err);
    models.sms.update({
      stat: 'yes',
    }, {where: {id: id}}
    );
    res.render('readMsg', {session: session, row: row, who: who});
  });
});

router.get('/mainBoard', function(req, res, next){
  var sql = "select id, listName, name, title, date_format(createdAt,'%Y-%m-%d') createdAt from texts where listName = '취미' or listName = '낙서장' or listName = '핫추' or listName = '고민상담소'";
  client.query(sql, function (err, rows) {
    if (err) console.error(err);
        client.query("select count(*) as count from texts where listName = '취미' or listName = '낙서장' or listName = '핫추' or listName = '고민상담소'" , (countQueryErr, countQueryResult) => {
          if (countQueryErr) console.error("err : " + countQueryErr);
          res.render('mainBoard', {rows: rows, length:countQueryResult[0].count, session:session, mail: mail});
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
            res.render('textForm', {row:row[0], session:session, cmt:selRes, where:whe, id:id, mail: mail});
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
    res.render('editText', {row:row[0], where: whe, session: session, id: id, mail: mail});
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

    models.texts.destroy({where: { name: session.name, title: body.title, input: body.input, id: body.textId}});
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
          res.render('seoulList', {rows: rows, page:page, length:countQueryResult[0].count, page_num:8, pass:true, where:whe, session:session, search: false, mail: mail});
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
        res.render('seoulList',{rows: rows, page:page, length:countQueryResult[0].count, page_num:8, pass:true, where:whe, session:session, search: true, mail: mail});
      });
    });
});
//검색후 페이징
router.get('/list/:whe/search/:page', function(req,res,next){
  let whe = req.params.whe;
  let page = req.params.page;
    var sql = "select id, name, title, input, date_format(createdAt,'%Y-%m-%d') createdAt from texts where "+ searchRange +" LIKE '%" + searchWord + "%' AND listName = '" + whe + "'";
    client.query(sql, function (err, rows) {
      if(err) console.error(err);
      client.query("select count(*) as count from texts where "+ searchRange +" LIKE '%"+searchWord+"%' AND listName = '" + whe + "'", (countQueryErr, countQueryResult) => {
        if(countQueryErr) console.error("err : " + countQueryErr);
        res.render('seoulList',{rows: rows, page:page, length:countQueryResult[0].count, page_num:8, pass:true, where:whe, session:session, search: true, mail: mail});
      });
    });
  });

//근처 유저
router.get('/users', function(req, res, next) {
  let search = session.modifyAddress;
  let search1 = search.split(' ');
  let a = search1[0];
  let b = search1[1];
  var sql = "SELECT image, name, birth FROM users WHERE modifyAddress LIKE '%" + a + "%' AND modifyAddress LIKE '%" + b + "%' ORDER BY rand() LIMIT 8";
  var sql2 = "SELECT count(*) as count FROM users WHERE modifyAddress LIKE '%" + a + "%' AND modifyAddress LIKE '%" + b + "%' ORDER BY rand() LIMIT 8";

  client.query(sql, function (err, rows) {
    if(err) console.error(err);
    client.query(sql2, function (countErr, countRows) {
      res.render('users', { session: session, length: countRows[0].count, rows: rows });
    });
  });
});

  
router.get('/chat', function(req, res, next){
  res.render('chat', { session: session, mail: mail });
});
//editText
router.get('/editText/:whe', function(req, res, next){
  let whe = req.params.whe;
  let row = -1;
  res.render('editText', {where: whe, row:row, session:session, mail: mail});
});
//마이페이지 내가 쓴 글
router.get('/myPage/:page', function(req,res,next){
    var page = req.params.page;
    var sql = "select id, name, title, listName, input, date_format(createdAt,'%Y-%m-%d') createdAt from texts where name = '" + session.name + "'";
    client.query(sql, function (err, rows) {
        if (err) console.error(err);
        client.query("select count(*) as count from texts where name= '"+session.name+"'" , (countQueryErr, countQueryResult) => {
          if (countQueryErr) console.error("err : " + countQueryErr);
          res.render('myPage', {rows: rows, page:page, length:countQueryResult[0].count, page_num:8, pass:true, session:session, mail: mail});
        });
        
    });
});
router.get('/delId', function(req,res,next){
  res.render('delId', {session:session, mail: mail});
});
router.get('/profile', function(req,res,next){
  res.render('profile', {session:session, mail: mail});
});
//editText 수정 Post 부분
router.post('/mod/:whe', function(req, res, next) {
  let body = req.body;
  let whe = req.params.whe;

  models.texts.update({
    title: body.title,
    input: body.input,
  }, {where: {id: body.id}}
  );
  res.redirect("/textForm/"+whe+"/"+body.id);
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
  res.render('pwConfirm', { session: session , mail: mail});
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
  res.render('profile', {rows: rows, session: session, data: data, mail: mail});
});
//프로필 변경 기능
router.post('/profile', upload.single('image'),async function(req, res, next){
  let body = req.body;
  let image = '/images/' + req.file.filename;

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

      models.user.update({image: image, pw: hashPassword, phone: body.phone, birth: body.birth, postcode: body.postcode, modifyAddress: body.modifyAddress, detailAddress: body.detailAddress},{where : { email: session.email }});

      res.redirect('/');
    }
});

router.get('/delId', function(req, res, next){
  res.render('delId', { session: session , mail: mail});
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
