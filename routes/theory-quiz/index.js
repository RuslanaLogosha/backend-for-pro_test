const express = require('express');
const router = express.Router();

const quizTheoryController = require('../../controllers/quiz-theory-controller');
// const guard = require('../../helpers/guard');

router.get('/questions', quizTheoryController.getRandomTheoryQuestions);
router.post('/results', quizTheoryController.getTheoryResults);

module.exports = router;
