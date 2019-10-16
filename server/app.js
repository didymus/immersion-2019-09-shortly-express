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


app.get('/', (req, res) => {
  res.render('index');
});

app.get('/create', (req, res) => {
  res.render('index');
});

app.get('/links', (req, res, next) => {
  Links.getAll()
    .then((links) => {
      res.status(200).send(links);
    })
    .catch((error) => {
      console.error('Failed to get links', error);
      res.sendStatus(500);
    });
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
