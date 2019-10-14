'use strict';

const adminAuthenticator = (req, res, next) => {
  if (req.body.adminPass === process.env.ADMIN_API_PASS) {
    console.log('admin successfully verified');
    next();
  } else {
    console.log('Invalid adminPass');
    res.sendStatus(401);
  }
};

module.exports = adminAuthenticator;
