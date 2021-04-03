const Joi = require('joi');
const { HttpCode } = require('../../helpers/constants');

const schemaCreateUser = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(50).required(),
});

const schemaLoginUser = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(50).required(),
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
