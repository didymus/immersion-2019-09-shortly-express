const parseCookies = (req, res, next) => {
  const cookieObject = {};
  if (req.headers.cookie) {
    let cookies = req.headers.cookie.split('; ');
    cookies.forEach((cookie) => {
      let cookieArray = cookie.split('=');
      cookieObject[cookieArray[0]] = cookieArray[1];
    });
  }
  req.cookies = cookieObject;
  next();
};

module.exports = parseCookies;