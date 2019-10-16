const mysql = require('promise-mysql');

const app = require('../server/app');
const initializeSchema = require('../server/db/initializeSchema');

const PORT = 8080;
const DB_NAME = 'shortly';

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
});

describe('Shortly', function() {
  let server;

  beforeEach(function(done) {
    Promise.resolve()
      .then(() => db.query(`DROP DATABASE IF EXISTS ${DB_NAME}`))
      .then(() => initializeSchema({
        dbName: DB_NAME,
        connection: db,
      }))
      .then(() => {
        server = app.listen(PORT, done);
      });
  });

  afterEach(function() {
    server.close();
  });

  describe('Schema', function() {
    require('./schema/userSchema.test')({ db });
    require('./schema/sessionSchema.test')({ db });
  });

  describe('Middleware', function() {
    require('./middleware/cookieParser.test')({ db });
    require('./middleware/createSession.test')({ db });
  });

  describe('Auth', function() {
    require('./auth/accountCreation.test')({ db });
    require('./auth/accountLogin.test')({ db });
    require('./auth/sessionsAndCookies.test')({ db });
    require('./auth/privilegedAccess.test')({ db });
  });

  require('./linkCreation.test')({ db });
});
