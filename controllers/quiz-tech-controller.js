const TechQuiz = require('../model/quiz-tech-model');
const { HttpCode, Status } = require('../helpers/constants');
const { getRandomInt } = require('../helpers/get-random-integer');
const resultWordings = require('../helpers/test-result-reply.json');

async function getRandomTechQuestions(req, res, next) {
  try {
    // fetching all questions from db
    const allQuestions = await TechQuiz.getAllQuestions();
    // forming a list of 12 random questions
    const randomQuestions = [];
    do {
      const randomIndex = getRandomInt(0, 25);
      const questionToInclude = allQuestions[randomIndex];
      if (!randomQuestions.includes(questionToInclude)) {
        randomQuestions.push(questionToInclude);
      }
    } while (randomQuestions.length < 12);
    // mapping resulted list to return only specific field
    const mappedRandomQuestions = randomQuestions.map(el => ({
      questionId: el.questionId,
      question: el.question,
      answers: el.answers,
    }));
    // sending successful response
    return res.status(HttpCode.OK).json({
      status: Status.SUCCESS,
      code: HttpCode.OK,
      data: mappedRandomQuestions,
    });
  } catch (e) {
    next(e);
  }
}

async function getTechResults(req, res, next) {
  try {
    // accepting results as send by front-end
    const resultsToCheck = req.body;
    // checking results
    const checkedResults = await Promise.all(
      resultsToCheck.map(async el => {
        const question = await TechQuiz.findById(el.questionId);
        const checkedAnswer = question.rightAnswer === el.answer;
        return {
          questionId: el.questionId,
          result: checkedAnswer,
        };
      }),
    );
    // counting correct answers
    const correctAnswersCount = checkedResults.filter(el => el.result === true);
    // counting correct / incorrect percentage
    const correctPercentage = Number(
      Math.round((correctAnswersCount.length / checkedResults.length) * 100),
    );
    const incorrectPercentage = Number(100 - correctPercentage);
    // getting wordings
    const { aboutResultTitle, aboutResultSubtitle } = resultWordings.find(
      ({ id }) => id === String(correctAnswersCount.length),
    );
    // sending successful response
    return res.status(HttpCode.OK).json({
      status: Status.SUCCESS,
      code: HttpCode.OK,
      data: {
        testType: 'Tech',
        totalAnswersCount: Number(checkedResults.length),
        correctAnswersCount: Number(correctAnswersCount.length),
        correctPercentage,
        incorrectPercentage,
        aboutResultTitle,
        aboutResultSubtitle,
      },
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getRandomTechQuestions,
  getTechResults,
};
