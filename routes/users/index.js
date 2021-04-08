const express = require('express');
const router = express.Router();
const validate = require('./validation');
const userController = require('../../controllers/users');
const guard = require('../../helpers/guard');

const { createAccountLimiter } = require('../../helpers/rate-limit-reg');

router.post(
  '/auth/register',
  createAccountLimiter,
  validate.createUser,
  userController.register,
);
router.post('/auth/login', validate.loginUser, userController.login);
router.post('/auth/logout', guard, userController.logout);
router.get('/current', guard, userController.getCurrentUser);
router.post(
  '/auth/refresh',
  validate.refreshToken,
  userController.refreshTokenPair,
);

module.exports = router;
