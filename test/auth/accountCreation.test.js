const { expect } = require('chai');
const axios = require('axios');

module.exports = ({ db }) => {
  describe('Account Creation /signup', function() {
    it('signup creates a new user record', function() {
      const body = {
        username: 'Samantha',
        password: 'Samantha',
      };

      return axios.post('http://127.0.0.1:8080/signup', body)
        .then(() => db.query('SELECT * FROM users where username = "Samantha"'))
        .then((users) => {
          const user = users[0];

          expect(user).to.exist;
          expect(user.username).to.equal('Samantha');
        });
    });

    it('does not store the user\'s original text password', function() {
      const body = {
        username: 'Samantha',
        password: 'Samantha',
      };

      return axios.post('http://127.0.0.1:8080/signup', body)
        .then(() => db.query('SELECT password FROM users where username = "Samantha"'))
        .then((users) => {
          const user = users[0];

          expect(user.password).to.exist;
          expect(user.password).to.not.equal('Samantha');
        });
    });

    it('redirects to signup if the user already exists', function() {
      const body = {
        username: 'Samantha',
        password: 'Samantha',
      };

      return axios.post('http://127.0.0.1:8080/signup', body)
        .then(() => axios.post('http://127.0.0.1:8080/signup', body, {
          // Not following redirect
          maxRedirects: 0,
          validateStatus: status => status >= 200 && status <= 302,
        }))
        .then((response) => {
          expect(response.headers.location).to.equal('/signup');
        });
    });

    it('redirects to index after user is created', function() {
      const body = {
        username: 'Samantha',
        password: 'Samantha',
      };

      return axios.post('http://127.0.0.1:8080/signup', body, {
        // Not following redirect
        maxRedirects: 0,
        validateStatus: status => status >= 200 && status <= 302,
      }).then((response) => {
        expect(response.headers.location).to.equal('/');
      });
    });
  });
};
