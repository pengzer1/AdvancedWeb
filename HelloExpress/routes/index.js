const express = require('express');
const router = express.Router();
const mysql = require("mysql");   // mysql 모듈 require

// 커넥션 연결
let client = mysql.createConnection({
  user: "root",
  password: "ckalswo6312!",
  database: "mysqltest"
})

router.get('/create', function(req, res, next) {
  client.query("SELECT * FROM products;", function(err, result, fields){
    if(err){
      console.log(err);
      console.log("쿼리문에 오류가 있습니다.");
    }
    else{
      res.render('create', {
        results: result
      });
    }
  });
});

router.post('/create', function(req, res, next) {
  var body = req.body;

  client.query("INSERT INTO products (name, modelnumber, series) VALUES (?, ?, ?)", [
    body.name, body.modelnumber, body.series
  ], function(){
    res.redirect("/create");
  });
});

module.exports = router;