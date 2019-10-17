const express = require('express');
const path = require('path');
const partials = require('express-partials');
const bodyParser = require('body-parser');

const { Users, Sessions, Links, Clicks } = require('./models');
const { createSession, verifySession } = require('./middleware/auth');
const cookieParser = require('./middleware/cookieParser');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');

app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/__docs', express.static(path.join(__dirname, '../docs')));


app.get('/', cookieParser, createSession, (req, res) => {
  // if current session not attached to a user redirect to login
  if (req.session.userId === null) {
    res.setHeader('Location', '/login');
    res.render('login');
  } else {
    res.render('index');
  }
});

app.get('/create', cookieParser, createSession, (req, res) => {
  if (req.session.userId === null) {
    res.setHeader('Location', '/login');
    res.render('login');
  } else {
    res.render('index');
  }
});

app.get('/links', cookieParser, createSession, (req, res, next) => {
  if (req.session.userId === null) {
    res.setHeader('Location', '/login');
    res.render('login');
  } else {
    Links.getAll()
      .then((links) => {
        res.status(200).send(links);
      })
      .catch((error) => {
        console.error('Failed to get links', error);
        res.sendStatus(500);
      });
  }
});

app.post('/links', (req, res, next) => {
  const { url } = req.body;

  if (!Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
    return res.sendStatus(404);
  }

  return Links.get({ url })
    .then((link) => {
      if (link) {
        return link;
      }

      return Links.getUrlTitle(url)
        .then(title => Links.create({
          url,
          title,
          baseUrl: req.headers.origin,
        }))
        .then(queryResponse => Links.get({ id: queryResponse.insertId }));
    })
    .then((link) => {
      return res.status(200).send(link);
    })
    .catch((error) => {
      console.error('Failed to create new link', error);
      res.sendStatus(500);
    });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/signup', cookieParser, (req, res) => {
  res.render('signup');
});

app.post('/signup', cookieParser, createSession, (req, res) => {
  // register user for a new account
  const username = req.body.username;
  const password = req.body.password;
  Users.create({
    username,
    password,
  })
    .then((userData) => {
      // update current session to include user id
      Sessions.update({
        hash: req.session.hash,
      }, {
        userId: userData.insertId,
      })
        .then((updateData) => {
          // then redirect to '/'
          res.setHeader('Location', '/');
          res.render('index');
        });
    })
    .catch(() => {
      // if user is already signed up redirect back to '/signup'
      res.setHeader('Location', '/signup');
      res.render('signup'); // FIXME: possible fix later on to redirect to login instead
    });

});

app.get('/login', cookieParser, (req, res) => {
  res.render('login');
});

app.post('/login', cookieParser, (req, res) => {
  // compare passed in credentials
  const username = req.body.username;
  const attemptedPass = req.body.password;
  Users.get({
    username,
  })
    .then((userData) => {
      // check if user data exists and if the passwords pass
      if (userData && Users.compare(attemptedPass, userData.password, userData.salt)) {
        // then redirect to '/'
        res.setHeader('Location', '/');
        res.render('index');
      } else {
        // if user does not exist or incorrect credentials are passed -> redirect to '/login'
        res.setHeader('Location', '/login');
        res.render('login');
      }
    })
    .catch((err) => {
      console.error(err);
    });
});

app.get('/logout', cookieParser, (req, res) => {
  // reassign shortlyid cookie to null
  res.cookie('shortlyid', null);
  // delete session from database
  Sessions.delete({hash: req.cookies.shortlyid});
  res.render('index');
});

/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res) => {
  const { code } = req.params;

  return Links.get({ code })
    .then((link) => {
      if (!link) {
        return res.redirect('/');
      }

      return Clicks.create({ linkId: link.id })
        .then(() => Links.update(link, { visits: link.visits + 1 }))
        .then(() => {
          res.redirect(link.url);
        });
    })
    .catch((error) => {
      console.error('Failed get link', error);
      res.sendStatus(500);
    });
});

module.exports = app;
