const { expect } = require('chai');
const axios = require('axios');
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const tough = require('tough-cookie');

module.exports = ({ db }) => {
  describe('Sessions and cookies', function() {
    let cookieJar;
    let requestWithSession;

    axiosCookieJarSupport(axios);

    const addUser = () => {
      const body = {
        username: 'Vivian',
        password: 'Vivian',
      };

      return requestWithSession.post('http://127.0.0.1:8080/signup', body);
    };

    beforeEach(function() {
      cookieJar = new tough.CookieJar();
      requestWithSession = axios.create({
        withCredentials: true,
        jar: cookieJar,
      });
    });

    it('saves a new session when the server receives a request', function() {
      return requestWithSession('http://127.0.0.1:8080/')
        .then(() => db.query('SELECT * FROM sessions'))
        .then((sessions) => {
          expect(sessions.length).to.equal(1);
          expect(sessions[0].userId).to.be.null;
        });
    });

    it('sets and stores a cookie on the client', function() {
      return requestWithSession('http://127.0.0.1:8080/')
        .then((response) => {
          const cookies = cookieJar.getCookiesSync('http://127.0.0.1:8080');
          expect(cookies.length).to.equal(1);
        });
    });

    it('assigns session to a user when user logs in', function() {
      return addUser()
        .then((response) => {
          const cookies = cookieJar.getCookiesSync('http://127.0.0.1:8080');
          const cookie = cookies[0].value;
          const queryString = `
            SELECT users.username FROM users, sessions
            WHERE sessions.hash = ? AND users.id = sessions.userId
          `;

          return db.query(queryString, cookie);
        })
        .then((users) => {
          const user = users[0];
          expect(user.username).to.equal('Vivian');
        });
    });

    it('destroys session and cookie when logs out', function() {
      let originalCookie;

      return addUser()
        .then(() => {
          const cookies = cookieJar.getCookiesSync('http://127.0.0.1:8080');
          const cookie = cookies[0].value;

          originalCookie = cookie;
        })
        .then(() => requestWithSession('http://127.0.0.1:8080/logout'))
        .then(() => {
          const cookies = cookieJar.getCookiesSync('http://127.0.0.1:8080');
          const cookie = cookies[0].value;

          expect(cookie).to.not.equal(originalCookie);
        })
        .then(() => db.query('SELECT * FROM sessions WHERE hash = ?', originalCookie))
        .then((sessions) => {
          expect(sessions.length).to.equal(0);
        });
    });
  });
};
