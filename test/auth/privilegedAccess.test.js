const { expect } = require('chai');
const axios = require('axios');

module.exports = ({ db }) => {
  describe('Privileged Access', function() {
    it('Redirects to login page if a user tries to access the main page and is not signed in', function() {
      return axios.get('http://127.0.0.1:8080/', {
        // Not following redirect
        maxRedirects: 0,
        validateStatus: status => status >= 200 && status <= 302,
      }).then((response) => {
        expect(response.headers.location).to.equal('/login');
      });
    });

    it('Redirects to login page if a user tries to access the create page and is not signed in', function() {
      return axios.get('http://127.0.0.1:8080/create', {
        // Not following redirect
        maxRedirects: 0,
        validateStatus: status => status >= 200 && status <= 302,
      }).then((response) => {
        expect(response.headers.location).to.equal('/login');
      });
    });

    it('Redirects to login page if a user tries to see all of the links and is not signed in', function() {
      return axios.get('http://127.0.0.1:8080/links', {
        // Not following redirect
        maxRedirects: 0,
        validateStatus: status => status >= 200 && status <= 302,
      }).then((response) => {
        expect(response.headers.location).to.equal('/login');
      });
    });
  });
};
