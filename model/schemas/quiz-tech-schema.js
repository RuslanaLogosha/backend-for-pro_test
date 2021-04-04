const { Schema, model } = require('mongoose');

const TechQuizSchema = new Schema({
  question: {
    type: String,
  },
  questionId: {
    type: String,
    unique: true,
  },
  answers: {
    type: Array,
  },
  rightAnswer: {
    type: String,
  },
});

const TechQuiz = model('techQuiz', TechQuizSchema);

module.exports = TechQuiz;
