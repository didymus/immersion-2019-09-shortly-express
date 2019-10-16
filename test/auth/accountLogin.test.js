const { expect } = require('chai');
const axios = require('axios');

module.exports = ({ db }) => {
  describe('Account Login /login', function() {
    beforeEach(function() {
      const body = {
        username: 'Samantha',
        password: 'Samantha',
      };

      return axios.post('http://127.0.0.1:8080/signup', body);
    });

    it('Logs in existing users', function() {
      const body = {
        username: 'Samantha',
        password: 'Samantha',
      };

      return axios.post('http://127.0.0.1:8080/login', body, {
        // Not following redirect
        maxRedirects: 0,
        validateStatus: status => status >= 200 && status <= 302,
      }).then((response) => {
        expect(response.headers.location).to.equal('/');
      });
    });

    it('Users that do not exist are kept on login page', function() {
      const body = {
        username: 'Fred',
        password: 'Fred',
      };

      return axios.post('http://127.0.0.1:8080/login', body, {
        // Not following redirect
        maxRedirects: 0,
        validateStatus: status => status >= 200 && status <= 302,
      }).then((response) => {
        expect(response.headers.location).to.equal('/login');
      });
    });

    it('Users that enter an incorrect password are kept on login page', function() {
      const body = {
        username: 'Samantha',
        password: 'Alexander',
      };

      return axios.post('http://127.0.0.1:8080/login', body, {
        // Not following redirect
        maxRedirects: 0,
        validateStatus: status => status >= 200 && status <= 302,
      }).then((response) => {
        expect(response.headers.location).to.equal('/login');
      });
    });
  });
};
