const express = require('express');
const router = express.Router();
const validate = require('./validation');
const userController = require('../../controllers/users');
const guard = require('../../helpers/guard');

const { createAccountLimiter } = require('../../helpers/rate-limit-reg');

router
  .post('/auth/login', validate.loginUser, userController.login)
  .post('/auth/logout', guard, userController.logout)
  .post(
    '/auth/register',
    createAccountLimiter,
    validate.createUser,
    userController.register,
  );

router
  .get('/current', guard, userController.getCurrentUser)
  .get('/auth/google', userController.googleAuth)
  .get('/auth/google-redirect', userController.googleRedirect);

module.exports = router;
