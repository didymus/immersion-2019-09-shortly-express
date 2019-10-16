const { expect } = require('chai');

module.exports = ({ db }) => {
  describe('User Schema', function() {
    it('contains a users table', function() {
      return db.query('SELECT * FROM users').then((users) => {
        expect(users).to.deep.equal([]);
      });
    });

    it('contains id, username, password columns', function() {
      const newUser = {
        username: 'Howard',
        password: 'p@ssw0rd',
      };

      return db.query('INSERT INTO users SET ?', newUser)
        .then(() => db.query('SELECT * FROM users WHERE username = ?', newUser.username))
        .then((users) => {
          const user = users[0];

          expect(user.username).to.exist;
          expect(user.password).to.exist;
          expect(user.id).to.exist;
        });
    });

    it('only allows unique usernames', function() {
      const newUser = {
        username: 'Howard',
        password: 'p@ssw0rd',
      };

      return db.query('INSERT INTO users SET ?', newUser)
        .then(() => db.query('INSERT INTO users SET ?', newUser))
        .then(() => {
          throw new Error('Should have failed');
        })
        .catch((err) => {
          expect(err).to.exist;
          expect(err.code).to.equal('ER_DUP_ENTRY');
        });
    });

    it('should increment the id of new rows', function() {
      const userHoward = {
        username: 'Howard',
        password: 'p@ssw0rd',
      };
      const userMuhammed = {
        username: 'Muhammed',
        password: 'p@ssw0rd',
      };

      let userHowardId;

      return db.query('INSERT INTO users SET ?', userHoward)
        .then((queryResponse) => {
          userHowardId = queryResponse.insertId;
        })
        .then(() => db.query('INSERT INTO users SET ?', userMuhammed))
        .then((queryResponse) => {
          const userMuhammedId = queryResponse.insertId;
          expect(userMuhammedId).to.equal(userHowardId + 1);
        });
    });
  });
};
