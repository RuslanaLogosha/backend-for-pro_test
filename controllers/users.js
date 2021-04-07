const jwt = require('jsonwebtoken');
const Users = require('../model/users');
const { Status, HttpCode } = require('../helpers/constants');
const Session = require('../model/schemas/session-schema');

require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET;

const register = async (req, res, next) => {
  try {
    const { email } = req.body;
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
    // const isValidPassword = await regUser.validPassword(password);
    // if (!regUser || !isValidPassword) {
    //   return res.status(HttpCode.UNAUTHORIZED).json({
    //     status: Status.ERROR,
    //     code: HttpCode.UNAUTHORIZED,
    //     data: 'Unauthorized',
    //     message: 'Email or password is wrong',
    //   });
    // }

    const userId = regUser._id;
    // creating a new session
    const newSession = await Session.create({ userId });
    const sessionId = newSession._id;
    // const payload = { id };
    // creating token pair. access token is stored in Urer. refresh token - ???
    const token = jwt.sign({ userId, sessionId }, SECRET_KEY, {
      expiresIn: '30m',
    });
    const refreshToken = jwt.sign({ userId, sessionId }, SECRET_KEY, {
      expiresIn: '30d',
    });
    await Users.updateToken(userId, token);
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
        payload = jwt.verify(reqRefreshToken, process.env.JWT_SECRET);
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

      const newSession = await Session.create({
        userId: user._id,
      });
      const token = jwt.sign(
        { userId: user._id, sessionId: newSession._id },
        process.env.JWT_SECRET,
        {
          expiresIn: '30m',
        },
      );
      const newRefreshToken = jwt.sign(
        { userId: user._id, sessionId: newSession._id },
        process.env.JWT_SECRET,
        { expiresIn: '30d' },
      );
      await Users.updateToken({ _id: user._id }, token);
      return res.status(HttpCode.OK).json({
        status: Status.SUCCESS,
        code: HttpCode.OK,
        data: {
          token,
          newRefreshToken,
          sessionId: newSession._id,
        },
      });
    }

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
    const userId = user._id;
    const newSession = await Session.create({ userId });
    const sessionId = newSession._id;
    // const payload = { id };
    const token = jwt.sign({ userId, sessionId }, SECRET_KEY, {
      expiresIn: '30m',
    });
    const refreshToken = jwt.sign({ userId, sessionId }, SECRET_KEY, {
      expiresIn: '30d',
    });
    await Users.updateToken(userId, token);
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

  console.log(userId);
  console.log(sessionId);

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

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  refreshTokenPair,
};
