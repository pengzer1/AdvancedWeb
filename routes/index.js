var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var models = require('../models');
var crypto = require('crypto');
var session = require('express-session');

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
  res.render('index', { title: 'Neighbor' });
});

// 로그인 GET
router.get('/sign_in', function(req, res, next){
  let session = req.session;

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
  
    if(dbPassword === hashPassword){
        console.log("비밀번호 일치");
        // 세션 설정
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
                  res.redirect('/sign_in');
              }
          );          //세션정보 삭제

      } else {
          console.log('로긴 안되어 있음');
          res.redirect('/sign_in');
      }
  }
);

//로그아웃 GET
/*router.get("/logout", function(req,res){
  req.session.destroy();
  res.clearCookie("sid");

  res.redirect("/sign_in");
});*/

router.get('/sign_up', function(req, res, next){
  res.render('sign_up');
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
  res.render('mainBoard');
});
router.get('/seoulList', function(req, res, next){
  models.text.findAll().then(result => {
    res.render('seoulList', {
      text: result
    });
  });
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
    listName: body.listName,
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
