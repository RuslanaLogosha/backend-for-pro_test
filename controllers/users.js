const jwt = require('jsonwebtoken');
const queryString = require('query-string');
const axios = require('axios');
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

const googleAuth = async (_req, res, next) => {
  try {
    const stringifiedParams = queryString.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: `${process.env.BASE_URL}/users/auth/google-redirect`,
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ].join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
    });
    return res.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${stringifiedParams}`,
    );
  } catch (e) {
    next(e);
  }
};

const googleRedirect = async (req, res, next) => {
  try {
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const urlObj = new URL(fullUrl);
    const urlParams = queryString.parse(urlObj.search);
    const code = urlParams.code;

    const tokenData = await axios({
      url: `https://oauth2.googleapis.com/token`,
      method: 'post',
      data: {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.BASE_URL}/users/auth/google-redirect`,
        grant_type: 'authorization_code',
        code,
      },
    });
    const userData = await axios({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo',
      method: 'get',
      headers: {
        Authorization: `Bearer ${tokenData.data.access_token}`,
      },
    });
    console.log(userData.data);

    return res.redirect(
      `${process.env.FRONTEND_URL}?email=${userData.data.email}`,
    );
  } catch (e) {
    next(e);
  }
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  googleAuth,
  googleRedirect,
};
