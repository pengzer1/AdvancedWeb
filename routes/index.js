var express = require('express');
var router = express.Router();
var mysql = require('mysql2');
var models = require('../models');
var crypto = require('crypto');

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
  var sql = "select id, listName, name, date_format(createdAt,'%Y-%m-%d') createdAt from texts where listName = '취미' or listName = '낙서장' or listName = '핫추' or listName = '고민상담소'";
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
        res.render('textForm', {row:row[0], where:whe, session:session});
  });
});
//페이징
router.get('/list/:whe/:page',function(req,res,next)
{
    var whe = req.params.whe;
    var page = req.params.page;
    var sql = "select id, name, input, date_format(createdAt,'%Y-%m-%d') createdAt from texts where listName = '" + whe + "'";
    client.query(sql, function (err, rows) {
        if (err) console.error(err);
        client.query("select count(*) as count from texts where listName= '"+whe+"'" , (countQueryErr, countQueryResult) => {
          if (countQueryErr) console.error("err : " + countQueryErr);
          res.render('seoulList', {rows: rows, page:page, length:countQueryResult[0].count, page_num:8, pass:true, where:whe, session:session});
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
  res.render('editText', {where: whe, session:session});
});
router.get('/myPage', function(req,res,next){
  res.render('myPage', {session:session});
});
router.get('/delId', function(req,res,next){
  res.render('delId', {session:session});
});
router.get('/profile', function(req,res,next){
  res.render('profile', {session:session});
});
//editText Post 부분
router.post('/edt/:whe', function(req, res, next) {
  let body = req.body;
  let whe = req.params.whe;

  models.texts.create({
    listName: body.listName,
      name: body.name,
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
      res.redirect("/myPage");
    }
    else{
      console.log("비밀번호 불일치");
      res.redirect("/pwConfirm");
    }
  }
});

router.get('/myPage', function(req, res, next){
  res.render('myPage', { session: session });
});

router.get('/profile', function(req, res, next){
  res.render('profile', { session: session });
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
