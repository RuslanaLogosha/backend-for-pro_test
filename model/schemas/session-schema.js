const { Schema, model } = require('mongoose');

const sessionSchema = new Schema({
  userId: {
    type: String,
  },
});

const SessionModel = model('session', sessionSchema);

module.exports = SessionModel;
