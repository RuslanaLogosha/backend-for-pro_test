const TheoryQuiz = require('./schemas/quiz-theory-schema');

async function getAllQuestions() {
  return await TheoryQuiz.find({});
}

async function findById(id) {
  return await TheoryQuiz.findOne({ questionId: id });
}

module.exports = {
  getAllQuestions,
  findById,
};
