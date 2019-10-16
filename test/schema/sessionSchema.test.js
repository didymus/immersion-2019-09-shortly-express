const { expect } = require('chai');

module.exports = ({ db }) => {
  describe('Session Schema', function() {
    it('contains a sessions table', function() {
      return db.query('SELECT * FROM sessions')
        .then((sessions) => {
          expect(sessions).to.deep.equal([]);
        });
    });

    it('contains id, hash, userId columns', function() {
      const newSession = {
        hash: 'e98f26e5c90a09e391eee2211b57a61b5dc836d5',
      };

      return db.query('INSERT INTO sessions SET ?', newSession)
        .then(() => db.query('SELECT * FROM sessions WHERE hash = ?', newSession.hash))
        .then((sessions) => {
          const session = sessions[0];

          expect(session.id).to.exist;
          expect(session.userId).to.be.null;
          expect(session.hash).to.equal(newSession.hash);
        });
    });

    it('should increment the id of new rows', function() {
      const newSession = {
        hash: 'e98f26e5c90a09e391eee2211b57a61b5dc836d5',
      };
      const otherSession = {
        hash: 'eba8eb6ec4ede04f2287e67014ccd4c3c070a20f',
      };

      let newSessionId;

      return db.query('INSERT INTO sessions SET ?', newSession)
        .then((queryResponse) => {
          newSessionId = queryResponse.insertId;
        })
        .then(() => db.query('INSERT INTO sessions SET ?', otherSession))
        .then((queryResponse) => {
          const sessionId = queryResponse.insertId;
          expect(sessionId).to.equal(newSessionId + 1);
        });
    });
  });
};
