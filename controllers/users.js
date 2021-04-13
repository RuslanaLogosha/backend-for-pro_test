const jwt = require('jsonwebtoken');
const queryString = require('query-string');
const axios = require('axios');
const Users = require('../model/users');
const { Status, HttpCode } = require('../helpers/constants');
const Session = require('../model/schemas/session-schema');

require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET;
const REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET;

const createSessionAndIssueTokens = async userId => {
  // creating a new session
  const newSession = await Session.create({ userId });
  const sessionId = newSession._id;
  // creating token pair. access token is stored in User. refresh token is not stored
  const token = jwt.sign({ userId, sessionId }, SECRET_KEY, {
    expiresIn: '30m',
  });
  const refreshToken = jwt.sign({ userId, sessionId }, REFRESH_SECRET_KEY, {
    expiresIn: '30d',
  });
  await Users.updateToken(userId, token);
  return { token, refreshToken, sessionId };
};

const register = async (req, res, next) => {
  try {
    const { email } = req.body;
    // checking whether user is already registered
    const user = await Users.findByEmail(email);
    // throwing 409 if user is already in db
    if (user) {
      return res.status(HttpCode.CONFLICT).json({
        status: Status.ERROR,
        code: HttpCode.CONFLICT,
        data: 'Conflict',
        message: 'Email is used',
      });
    }
    // creating user in db
    const newUser = await Users.create({
      ...req.body,
    });
    const regUser = await Users.findByEmail(email);
    // creating session and issuing tokens
    const userId = regUser._id;
    const {
      token,
      refreshToken,
      sessionId,
    } = await createSessionAndIssueTokens(userId);
    // returning successful result
    return res.status(HttpCode.CREATED).json({
      status: Status.SUCCESS,
      code: HttpCode.CREATED,
      data: {
        token,
        refreshToken,
        sessionId,
        user: {
          email: newUser.email,
        },
      },
    });
  } catch (e) {
    next(e);
  }
};

const refreshTokenPair = async (req, res, next) => {
  try {
    // checking for refresh token
    const authorizationHeader = req.get('Authorization');

    // refusing to refresh token pair if req.session is not in db
    if (authorizationHeader) {
      const activeSession = await Session.findById(req.body.sessionId);
      if (!activeSession) {
        return res.status(HttpCode.NOT_FOUND).json({
          status: Status.ERROR,
          code: HttpCode.NOT_FOUND,
          data: {
            message: 'invalid session',
          },
        });
      }

      const reqRefreshToken = authorizationHeader.replace('Bearer ', '');

      // refusing to refresh token pair if refresh token is invalid/expired
      let payload;
      try {
        payload = jwt.verify(reqRefreshToken, REFRESH_SECRET_KEY);
      } catch (err) {
        await Session.findByIdAndDelete(req.body.sessionId);
        return res.status(HttpCode.UNAUTHORIZED).json({
          status: Status.ERROR,
          code: HttpCode.UNAUTHORIZED,
          data: 'Unauthorized',
          message: 'Unauthorized',
        });
      }
      // fetching user & session from db & throwing errors if they are not found
      const user = await Users.findById(payload.userId);
      const session = await Session.findById(payload.sessionId);
      if (!user) {
        return res.status(HttpCode.NOT_FOUND).json({
          status: Status.ERROR,
          code: HttpCode.NOT_FOUND,
          data: {
            message: 'user not found',
          },
        });
      }
      if (!session) {
        return res.status(HttpCode.NOT_FOUND).json({
          status: Status.ERROR,
          code: HttpCode.NOT_FOUND,
          data: {
            message: 'session not found',
          },
        });
      }
      // deleting current session & creating a new one with new pair of tokens
      await Session.findByIdAndDelete(payload.sessionId);
      // clearing all sessions in user has more than 3 sessions upon refresh request
      const userSessions = await Session.find({ userId: user._id });
      if (userSessions.length > 3) {
        await Session.deleteMany({ userId: user._id });
      }
      // creating session and issuing tokens
      const userId = user._id;
      const {
        token,
        refreshToken,
        sessionId,
      } = await createSessionAndIssueTokens(userId);
      // returning successful result
      return res.status(HttpCode.OK).json({
        status: Status.SUCCESS,
        code: HttpCode.OK,
        data: {
          token,
          refreshToken,
          sessionId,
        },
      });
    }
    //  throwing 400 if there is no authorization in header
    return res.status(HttpCode.BAD_REQUEST).json({
      status: Status.ERROR,
      code: HttpCode.BAD_REQUEST,
      data: {
        message: 'token not provided',
      },
    });
  } catch (e) {
    next(e);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // checking if we have user in db and if password is correct. Throwing 401 if not.
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
    // creating session and issuing tokens
    const userId = user._id;
    const {
      token,
      refreshToken,
      sessionId,
    } = await createSessionAndIssueTokens(userId);
    // returning successful result
    return res.status(HttpCode.OK).json({
      status: Status.SUCCESS,
      code: HttpCode.OK,
      data: {
        token,
        refreshToken,
        sessionId,
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
  const userId = req.user._id;
  const sessionId = req.session._id;
  // deleting current session
  await Session.findByIdAndDelete(sessionId);
  // clearing all sessions in user has more than 3 sessions upon logous
  const userSessions = await Session.find({ userId });
  if (userSessions.length > 3) {
    await Session.deleteMany({ userId });
  }
  await Users.updateToken(userId, null);
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
        redirect_uri: `https://backend-for-pro-test.herokuapp.com/users/auth/google-redirect`,
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
    // check user emeil
    const { email } = userData.data;
    const user = await Users.findByEmail(email);
    // login, if DB has this email
    if (user) {
      const isValidPassword = await user.validPassword(
        process.env.GOOGLE_AUTH_PASSWORD,
      );
      if (!isValidPassword) {
        return res.status(HttpCode.UNAUTHORIZED).json({
          status: Status.ERROR,
          code: HttpCode.UNAUTHORIZED,
          data: 'Unauthorized',
          message: 'Email or password is wrong',
        });
      }
      // creating session and issuing tokens
      const userId = user._id;
      const {
        token,
        refreshToken,
        sessionId,
      } = await createSessionAndIssueTokens(userId);

      return res.redirect(
        `https://pro-test-dev.netlify.app?email=${user.email}&token=${token}&refreshToken=${refreshToken}&sessionId=${sessionId}`,
      );
      //  registration new user, if BD don't have this email
    } else {
      const newUser = await Users.create({
        email,
        password: process.env.GOOGLE_AUTH_PASSWORD,
      });
      const regUser = await Users.findByEmail(email);
      // creating session and issuing tokens
      const userId = regUser._id;
      const {
        token,
        refreshToken,
        sessionId,
      } = await createSessionAndIssueTokens(userId);

      return res.redirect(
        `https://pro-test-dev.netlify.app?email=${newUser.email}&token=${token}&refreshToken=${refreshToken}&sessionId=${sessionId}`,
      );
    }
  } catch (e) {
    next(e);
  }
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  googleRedirect,
  refreshTokenPair,
};
