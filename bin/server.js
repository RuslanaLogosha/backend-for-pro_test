const app = require('../app');
const db = require('../model/db');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

db.then(() => {
  app.listen(PORT, () => {
    console.log(`POST request to the homepage http://localhost:${PORT}`);
  });
}).catch(err => {
  console.log(`Server not running with error ${err.message}`);
  process.exit(1);
});
