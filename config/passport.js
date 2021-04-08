const passport = require('passport');
const { Strategy, ExtractJwt } = require('passport-jwt');
const Users = require('../model/users');
const Session = require('../model/schemas/session-schema');
require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET;

const params = {
  secretOrKey: SECRET_KEY,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

passport.use(
  new Strategy(params, async (payload, done) => {
    try {
      const user = await Users.findById(payload.userId);
      const session = await Session.findById(payload.sessionId);

      if (!user) {
        return done(new Error('User not found'));
      }
      if (!user.token) {
        return done(null, false);
      }
      return done(null, { user, session });
    } catch (err) {
      done(err);
    }
  }),
);
