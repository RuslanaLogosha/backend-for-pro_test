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

const Quiz = model('techQuiz', TechQuizSchema);

module.exports = Quiz;
