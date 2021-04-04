const express = require('express');
const router = express.Router();

const quizTechController = require('../../controllers/quiz-tech-controller');
// const guard = require('../../helpers/guard');

router.get('/questions', quizTechController.getRandomTechQuestions);
router.post('/results', quizTechController.getTechResults);

module.exports = router;
