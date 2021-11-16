var express = require('express');
var router = express.Router();
var db=require('../db/models');
var bcrypt= require('bcryptjs');

const { loginUser, logoutUser } = require('../auth');
const { check, validationResult } = require('express-validator');
const { asyncHandler, csrfProtection } = require("./utils");

router.get('/login', csrfProtection,(req, res)=> {
  res.render('user-login',{
    title: 'Login',
    csrfToken: req.csrfToken(),
  });

});

const loginValidators = [
  check('emailAddress')
    .exists({ checkFalsy: true })
    .withMessage('Provide a Valid Email Address'),
  check('password')
    .exists({ checkFalsy: true })
    .withMessage('Please provide a value for Password'),
];

router.post('/login',csrfProtection,loginValidators,
asyncHandler(async(req,res )=> {
  const{
    emailAddress,
    password,
  } = req.body;

  let errors=[];
  const validatorErrors = validationResult(req)

  if(validatorError.isEmpty()){
    const user=await db.User.findone({where: {emailAddress}});
    if(user!==null){
      const passwordMatch =await bcrypt.compare(password,user.hashedPassword.toString());

      if(passwordMatch){
        loginUser(req,res,user);
        return res.redirect('/');
      }
    }
    errors.push('Login failed for the given email address and password');
  } else{
    errors=validatorErrors.array().map((error)=>error.msg);
  }
  res.render('user-login',{
    title: 'Login',
      emailAddress,
      errors,
      csrfToken: req.csrfToken(),
  });
}));

router.post('/logout',(req,res)=>{
  logoutUser(req,res);
  res.redirect('/');
});

module.exports = router;
