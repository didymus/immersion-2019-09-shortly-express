const { expect } = require('chai');
const axios = require('axios');
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const tough = require('tough-cookie');

module.exports = ({ db }) => {
  describe('Link creation /links', function() {
    let cookieJar;
    let requestWithSession;

    axiosCookieJarSupport(axios);

    beforeEach(function() {
      cookieJar = new tough.CookieJar();
      requestWithSession = axios.create({
        withCredentials: true,
        jar: cookieJar,
      });

      const body = {
        username: 'Vivian',
        password: 'Vivian',
      };

      return requestWithSession.post('http://127.0.0.1:8080/signup', body);
    });

    afterEach(function() {
      return requestWithSession('http://127.0.0.1:8080/logout');
    });

    describe('Creating new links', function() {
      it('Only shortens valid urls, returning a 404 - Not found for invalid urls', function() {
        const body = {
          url: 'definitely not a valid url',
        };

        return requestWithSession.post('http://127.0.0.1:8080/links', body, {
          // Don't reject based on status code
          validateStatus: status => true,
        }).then((response) => {
          expect(response.status).to.equal(404);
        });
      });

      it('Responds with the short code', function() {
        const body = {
          url: 'http://www.google.com/',
        };

        return requestWithSession.post('http://127.0.0.1:8080/links', body)
          .then((response) => {
            expect(response.data.url).to.equal('http://www.google.com/');
            expect(response.data.code).to.not.be.null;
          });
      });

      it('New links create a database entry', function() {
        const body = {
          url: 'http://www.google.com/',
        };

        return requestWithSession.post('http://127.0.0.1:8080/links', body)
          .then(() => db.query('SELECT * FROM links WHERE url = "http://www.google.com/"'))
          .then((links) => {
            const foundUrl = links['0']['url'];
            expect(foundUrl).to.equal('http://www.google.com/');
          });
      });

      it('Fetches the link url title', function() {
        const body = {
          url: 'http://www.google.com/',
        };

        return requestWithSession.post('http://127.0.0.1:8080/links', body)
          .then(() => db.query('SELECT * FROM links WHERE title = "Google"'))
          .then((links) => {
            const foundUrl = links[0];
            expect(foundUrl).to.exist;

            const linkTitle = foundUrl.title;
            expect(linkTitle).to.equal('Google');
          });
      });
    });

    describe('With previously saved urls', function() {
      let link;

      beforeEach(function() {
        // save a link to the database
        link = {
          url: 'http://www.google.com/',
          title: 'Google',
          baseUrl: 'http://127.0.0.1:8080',
          code: '2387f',
        };
        return db.query('INSERT INTO links SET ?', link);
      });

      it('Returns the same shortened code', function() {
        const body = {
          url: 'http://www.google.com/',
        };

        return requestWithSession.post('http://127.0.0.1:8080/links', body)
          .then((response) => {
            const code = response.data.code;
            expect(code).to.equal(link.code);
          });
      });

      it('Shortcode redirects to correct url', function() {
        return requestWithSession.get(`http://127.0.0.1:8080/${link.code}`, {
          // Not following redirect
          maxRedirects: 0,
          validateStatus: status => status >= 200 && status <= 302,
        }).then((response) => {
          const currentLocation = response.headers.location;
          expect(currentLocation).to.equal('http://www.google.com/');
        });
      });

      it('Shortcode redirects to index if shortcode does not exist', function() {
        return requestWithSession.get('http://127.0.0.1:8080/doesNotExist', {
          // Not following redirect
          maxRedirects: 0,
          validateStatus: status => status >= 200 && status <= 302,
        }).then((response) => {
          const currentLocation = response.headers.location;
          expect(currentLocation).to.equal('/');
        });
      });

      it('Returns all of the links to display on the links page', function() {
        return requestWithSession.get('http://127.0.0.1:8080/links')
          .then((response) => {

            expect(response.data[0]).to.eql({
              id: 1,
              visits: 0,
              ...link,
            });
          });
      });
    });
  });
};
