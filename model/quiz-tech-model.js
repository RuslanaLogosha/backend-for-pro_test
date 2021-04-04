const TechQuiz = require('./schemas/quiz-tech-schema');

async function getAllQuestions() {
  return await TechQuiz.find({});
}

module.exports = {
  getAllQuestions,
};
