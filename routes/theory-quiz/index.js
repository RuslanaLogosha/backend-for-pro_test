const express = require('express');
const router = express.Router();

const quizTheoryController = require('../../controllers/quiz-theory-controller');
const guard = require('../../helpers/guard');

router.get('/questions', guard, quizTheoryController.getRandomTheoryQuestions);
router.post('/results', guard, quizTheoryController.getTheoryResults);

module.exports = router;
