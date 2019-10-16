const { expect } = require('chai');
const httpMocks = require('node-mocks-http');

const cookieParser = require('../../server/middleware/cookieParser');

module.exports = ({ db }) => {
  describe('Cookie Parser', function() {
    it('should assign an empty object to a session property on the request when there are no cookies', function(done) {
      const requestWithoutCookies = httpMocks.createRequest();
      const response = httpMocks.createResponse();

      cookieParser(requestWithoutCookies, response, () => {
        const { cookies } = requestWithoutCookies;

        expect(cookies).to.be.an('object');
        expect(cookies).to.eql({});

        done();
      });
    });

    it('parses cookies and assigns an object of key-value pairs to a session property on the request', function(done) {
      const requestWithCookies = httpMocks.createRequest({
        headers: {
          Cookie: 'shortlyid=8a864482005bcc8b968f2b18f8f7ea490e577b20',
        },
      });
      const requestWithMultipleCookies = httpMocks.createRequest({
        headers: {
          Cookie: 'shortlyid=18ea4fb6ab3178092ce936c591ddbb90c99c9f66; otherCookie=2a990382005bcc8b968f2b18f8f7ea490e990e78; anotherCookie=8a864482005bcc8b968f2b18f8f7ea490e577b20',
        },
      });
      const response = httpMocks.createResponse();

      cookieParser(requestWithCookies, response, () => {
        const { cookies } = requestWithCookies;

        expect(cookies).to.be.an('object');
        expect(cookies).to.eql({ shortlyid: '8a864482005bcc8b968f2b18f8f7ea490e577b20' });
      });

      cookieParser(requestWithMultipleCookies, response, () => {
        const { cookies } = requestWithMultipleCookies;

        expect(cookies).to.be.an('object');
        expect(cookies).to.eql({
          shortlyid: '18ea4fb6ab3178092ce936c591ddbb90c99c9f66',
          otherCookie: '2a990382005bcc8b968f2b18f8f7ea490e990e78',
          anotherCookie: '8a864482005bcc8b968f2b18f8f7ea490e577b20',
        });

        done();
      });
    });
  });
};
