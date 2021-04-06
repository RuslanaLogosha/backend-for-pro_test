const TheoryQuiz = require('../model/quiz-theory-model');
const { HttpCode, Status } = require('../helpers/constants');
const { getRandomInt } = require('../helpers/get-random-integer');

async function getRandomTheoryQuestions(req, res, next) {
  try {
    // const userId = req.user.id;

    // fetching all questions from db
    const allQuestions = await TheoryQuiz.getAllQuestions();

    // forming a list of 12 random questions
    const randomQuestions = [];

    do {
      const randomIndex = getRandomInt(0, 30);
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

async function getTheoryResults(req, res, next) {
  try {
    // accepting results as send by front-end
    const resultsToCheck = req.body;

    // checking results
    const checkedResults = await Promise.all(
      resultsToCheck.map(async el => {
        const question = await TheoryQuiz.findById(el.questionId);
        const checkedAnswer = question.rightAnswer === el.answer;
        return {
          questionId: el.questionId,
          result: checkedAnswer,
        };
      }),
    );

    // counting correct answers
    const correctAnswersCount = checkedResults.filter(el => el.result === true);

    return res.status(HttpCode.OK).json({
      status: Status.SUCCESS,
      code: HttpCode.OK,
      data: {
        totalAnswersCount: String(checkedResults.length),
        correctAnswersCount: String(correctAnswersCount.length),
      },
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getRandomTheoryQuestions,
  getTheoryResults,
};
