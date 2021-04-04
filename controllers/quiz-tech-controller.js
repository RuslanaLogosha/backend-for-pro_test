const TechQuiz = require('../model/quiz-tech-model');
const { HttpCode, Status } = require('../helpers/constants');
const { getRandomInt } = require('../helpers/get-random-integer');

async function getAll(req, res, next) {
  try {
    // const userId = req.user.id;

    // fetching all questions from db
    const allQuestions = await TechQuiz.getAllQuestions();

    // forming a list of 12 random questions
    let randomQuestions = [];

    do {
      const randomIndex = getRandomInt(0, 25);
      // console.log(randomIndex);
      const questionToInclude = allQuestions[randomIndex];

      if (!randomQuestions.includes(questionToInclude)) {
        randomQuestions.push(questionToInclude);
      }
    } while (randomQuestions.length < 12);

    // console.log(randomQuestions.length);

    // mapping resulted list to return only specific field
    const mappedRandomQuestions = randomQuestions.map(el => ({
      questionId: el.questionId,
      question: el.question,
      answers: el.answers,
    }));

    return res.status(HttpCode.OK).json({
      status: Status.SUCCESS,
      code: HttpCode.OK,
      data: mappedRandomQuestions,
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getAll,
};
