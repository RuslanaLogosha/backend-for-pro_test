const { Schema, model } = require('mongoose');

const TheoryQuizSchema = new Schema({
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

const TheoryQuiz = model('theoryQuiz', TheoryQuizSchema);

module.exports = TheoryQuiz;
