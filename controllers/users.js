const jwt = require('jsonwebtoken');
const Users = require('../model/users');
const { Status, HttpCode } = require('../helpers/constants');

require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET;

const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await Users.findByEmail(email);
    if (user) {
      return res.status(HttpCode.CONFLICT).json({
        status: Status.ERROR,
        code: HttpCode.CONFLICT,
        data: 'Conflict',
        message: 'Email is used',
      });
    }
    const newUser = await Users.create({
      ...req.body,
    });
    const regUser = await Users.findByEmail(email);
    const isValidPassword = await regUser.validPassword(password);
    if (!regUser || !isValidPassword) {
      return res.status(HttpCode.UNAUTHORIZED).json({
        status: Status.ERROR,
        code: HttpCode.UNAUTHORIZED,
        data: 'Unauthorized',
        message: 'Email or password is wrong',
      });
    }
    const id = regUser._id;
    const payload = { id };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '5h' });
    await Users.updateToken(id, token);
    return res.status(HttpCode.CREATED).json({
      status: Status.SUCCESS,
      code: HttpCode.CREATED,
      data: {
        token,
        user: {
          email: newUser.email,
        },
      },
    });
  } catch (e) {
    next(e);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await Users.findByEmail(email);
    const isValidPassword = await user.validPassword(password);
    if (!user || !isValidPassword) {
      return res.status(HttpCode.UNAUTHORIZED).json({
        status: Status.ERROR,
        code: HttpCode.UNAUTHORIZED,
        data: 'Unauthorized',
        message: 'Email or password is wrong',
      });
    }
    const id = user._id;
    const payload = { id };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '5h' });
    await Users.updateToken(id, token);
    return res.status(HttpCode.OK).json({
      status: Status.SUCCESS,
      code: HttpCode.OK,
      data: {
        token,
        user: {
          email: user.email,
        },
      },
    });
  } catch (e) {
    next(e);
  }
};

const logout = async (req, res, next) => {
  const id = req.user._id;
  await Users.updateToken(id, null);
  return res.status(HttpCode.NO_CONTENT).json({});
};

const getCurrentUser = async (req, res, next) => {
  try {
    const id = req.user._id;
    const user = await Users.findById(id);
    return res.status(HttpCode.OK).json({
      status: Status.SUCCESS,
      code: HttpCode.OK,
      data: {
        email: user.email,
      },
    });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
};
