const TechQuiz = require('./schemas/quiz-tech-schema');

async function getAllQuestions() {
  return await TechQuiz.find({});
}

async function findById(id) {
  return await TechQuiz.findOne({ questionId: id });
}

module.exports = {
  getAllQuestions,
  findById,
};
