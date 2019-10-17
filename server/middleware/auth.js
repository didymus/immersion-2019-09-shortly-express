const models = require('../models');

const createSession = (req, res, next) => {
  const cookies = req.cookies;
  // if we don't have cookies
  if (Object.keys(cookies).length === 0) {
    models.Sessions.create()
      .then((insertResults) => {
        return models.Sessions.get({id: insertResults.insertId});
      })
      .then((sessionData) => {
        req.session = sessionData;
        res.cookie('shortlyid', sessionData.hash);
        next();
      })
      .catch(err => console.error(err));
  } else { // if we have cookies
    models.Sessions.get({hash: cookies.shortlyid})
      .then((sessionData) => {
        if (sessionData) {
          req.session = sessionData;
          next();
        } else {
          models.Sessions.create()
            .then((insertResults) => {
              const options = {id: insertResults.insertId};
              return models.Sessions.get(options);
            })
            .then((sessionData) => {
              req.session = sessionData;
              res.cookie('shortlyid', sessionData.hash);
              next();
            })
            .catch(err => console.error(err));
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }
};

// Add additional authentication middleware functions below //

const verifySession = (req, res, next) => {
  if (req.session.userId === null) {
    res.setHeader('Location', '/login');
    res.render('login');
  } else {
    next();
  }
};


module.exports = {
  createSession,
  verifySession,
};
