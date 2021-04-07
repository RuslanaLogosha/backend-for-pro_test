const Joi = require('joi');
const { Mongoose } = require('mongoose');
const { HttpCode } = require('../../helpers/constants');

const schemaCreateUser = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(50).required(),
});

const schemaLoginUser = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(50).required(),
});

const schemaRefreshToken = Joi.object({
  sessionId: Joi.string()
    .custom((value, helpers) => {
      const isValidObjectId = Mongoose.Types.ObjectId.isValid(value);
      if (!isValidObjectId) {
        return helpers.message({
          custom: "Invalid 'sessionId'. Must be a MongoDB ObjectId",
        });
      }
      return value;
    })
    .required(),
});

const validate = (schema, obj, next) => {
  const { error } = schema.validate(obj);
  if (error) {
    const [{ message }] = error.details;
    return next({
      status: HttpCode.BAD_REQUEST,
      message: `Failed: ${message.replace(/"/g, '')}`,
    });
  }
  next();
};

module.exports.createUser = (req, res, next) => {
  return validate(schemaCreateUser, req.body, next);
};

module.exports.loginUser = (req, res, next) => {
  return validate(schemaLoginUser, req.body, next);
};

module.exports.refreshToken = (req, res, next) => {
  return validate(schemaRefreshToken, req.body, next);
};
