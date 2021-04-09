const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const { HttpCode } = require('./helpers/constants');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const usersRouter = require('./routes/users');
const techQuizRouter = require('./routes/tech-quiz');
const theoryQuizRouter = require('./routes/theory-quiz');

require('dotenv').config();

const app = express();

const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short';

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());

app.use('/users', usersRouter);
app.use('/techquiz', techQuizRouter);
app.use('/theoryquiz', theoryQuizRouter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (_req, res) => {
  res.send('Hello from Express!');
});

app.use((_req, res) => {
  res.status(HttpCode.NOT_FOUND).json({ message: 'Not found' });
});

app.use((err, _req, res, _next) => {
  res
    .status(err.status || HttpCode.INTERNAL_SERVER_ERROR)
    .json({ message: err.message });
});

module.exports = app;
