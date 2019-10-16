const models = require('../models');

const createSession = (req, res, next) => {
  const cookies = req.cookies;
  if (!Object.keys(cookies).length) {
    models.Sessions.create()
      .then((insertResults) => {
        return models.Sessions.get({id: insertResults.insertId});
      })
      .then((sessionData) => {
        res.cookie('shortlyid', sessionData.hash);
      })
      .catch(err => console.error(err));
  }
  next();
};

// Add additional authentication middleware functions below //

const verifySession = (req, res, next) => {

  next();
};


module.exports = {
  createSession,
  verifySession,
};
