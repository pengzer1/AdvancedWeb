const express = require('express');
const router = express.Router();
const models = require("../models");


router.get('/sign_up', function(req, res, next) {
  res.render("user/signup");
});


router.post("/sign_up", function(req,res,next){
  let body = req.body;

  models.user.create({
    name: body.userName,
    email: body.userEmail,
    password: body.password
  })
  .then( result => {
    res.redirect("/sign_up");
  })
  .catch( err => {
    console.log(err)
  })
})

module.exports = router;