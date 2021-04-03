const rateLimit = require('express-rate-limit');
const { status, HttpCode } = require('./constants');

const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  handler: (req, res, next) => {
    return res.status(HttpCode.BAD_REQUEST).json({
      status: status.ERROR,
      code: HttpCode.BAD_REQUEST,
      data: 'Bad request',
      message:
        'Too many registration requests. No more than 30 registration requests from one IP.',
    });
  },
});

module.exports = { createAccountLimiter };
