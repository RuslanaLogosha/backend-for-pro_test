const express = require('express');
const router = express.Router();

const quizTechController = require('../../controllers/quiz-tech-controller');
const guard = require('../../helpers/guard');

router.get('/questions', guard, quizTechController.getRandomTechQuestions);
router.post('/results', guard, quizTechController.getTechResults);

module.exports = router;
