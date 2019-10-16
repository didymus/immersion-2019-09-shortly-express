const { expect } = require('chai');
const httpMocks = require('node-mocks-http');

const { createSession } = require('../../server/middleware/auth');

module.exports = ({ db }) => {
  describe('Session Parser', function() {
    it('initializes a new session when there are no cookies on the request', function(done) {
      const requestWithoutCookies = httpMocks.createRequest();
      const response = httpMocks.createResponse();

      createSession(requestWithoutCookies, response, () => {
        const { session } = requestWithoutCookies;

        expect(session).to.exist;
        expect(session).to.be.an('object');
        expect(session.hash).to.exist;

        done();
      });
    });

    it('sets a new cookie on the response when a session is initialized', function(done) {
      const requestWithoutCookie = httpMocks.createRequest();
      const response = httpMocks.createResponse();

      createSession(requestWithoutCookie, response, () => {
        const { cookies } = response;

        expect(cookies['shortlyid']).to.exist;
        expect(cookies['shortlyid'].value).to.exist;

        done();
      });
    });

    it('assigns a session object to the request if a session already exists', function(done) {
      const requestWithoutCookie = httpMocks.createRequest();
      const response = httpMocks.createResponse();

      createSession(requestWithoutCookie, response, () => {
        const cookie = response.cookies.shortlyid.value;
        const secondResponse = httpMocks.createResponse();
        const requestWithCookies = httpMocks.createRequest();

        requestWithCookies.cookies.shortlyid = cookie;

        createSession(requestWithCookies, secondResponse, () => {
          const { session } = requestWithCookies;

          expect(session).to.be.an('object');
          expect(session.hash).to.exist;
          expect(session.hash).to.be.cookie;

          done();
        });
      });
    });

    it('creates a new hash for each new session', function(done) {
      const requestWithoutCookies = httpMocks.createRequest();
      const response = httpMocks.createResponse();

      createSession(requestWithoutCookies, response, () => {
        const sessionHashOne = requestWithoutCookies.session.hash;
        const secondRequestWithoutCookies = httpMocks.createRequest();
        const responseTwo = httpMocks.createResponse();

        createSession(secondRequestWithoutCookies, responseTwo, () => {
          const sessionHashTwo = secondRequestWithoutCookies.session.hash;

          expect(sessionHashOne).to.not.equal(sessionHashTwo);

          done();
        });
      });
    });

    it('assigns a username and userId property to the session object if the session is assigned to a user', function() {
      const requestWithoutCookie = httpMocks.createRequest();
      const response = httpMocks.createResponse();

      const requestWithCookies = httpMocks.createRequest();
      const secondResponse = httpMocks.createResponse();

      const username = 'BillZito';

      let userId;
      let hash;

      return db.query('INSERT INTO users (username) VALUES (?)', username)
        .then((queryResponse) => {
          userId = queryResponse.insertId;
        })
        .then(() => new Promise((resolve) => {
          createSession(requestWithoutCookie, response, () => {
            hash = requestWithoutCookie.session.hash;
            resolve();
          });
        }))
        .then(() => db.query('UPDATE sessions SET userId = ? WHERE hash = ?', [userId, hash]))
        .then(() => {
          requestWithCookies.cookies.shortlyid = hash;

          return new Promise((resolve) => {
            createSession(requestWithCookies, secondResponse, resolve);
          });
        })
        .then(() => {
          const { session } = requestWithCookies;

          expect(session).to.be.an('object');
          expect(session.user.username).to.eq(username);
          expect(session.userId).to.eq(userId);
        });
    });

    it('clears and reassigns a new cookie if there is no session assigned to the cookie', function(done) {
      const maliciousCookieHash = '8a864482005bcc8b968f2b18f8f7ea490e577b20';
      const response = httpMocks.createResponse();
      const requestWithMaliciousCookie = httpMocks.createRequest();

      requestWithMaliciousCookie.cookies.shortlyid = maliciousCookieHash;

      createSession(requestWithMaliciousCookie, response, () => {
        const cookie = response.cookies.shortlyid.value;

        expect(cookie).to.exist;
        expect(cookie).to.not.equal(maliciousCookieHash);

        done();
      });
    });
  });
};
