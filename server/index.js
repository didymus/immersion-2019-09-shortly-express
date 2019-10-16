const app = require('./app');
const { db, initializeSchema } = require('./db');

const PORT = 8080;
const DB_NAME = 'shortly';

initializeSchema({
  dbName: DB_NAME,
  connection: db,
})
  .then(() => {
    console.log('Initialized schema');
    app.listen(PORT, () => console.log(`Shortly is listening on ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to initialize schema', err);
  });
