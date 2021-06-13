const MongoUser = require('../model/user.model');
const apiResponses = require('../helpers/apiResponses');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const fs = require('fs');
const jwt = require('jsonwebtoken');

/**
 * For User registration.
 *
 */
exports.AddUser = [
  [
    check('name')
      .trim()
      .escape()
      .exists()
      .isLength({ min: 1 })
      .withMessage('Name is required')
      .bail(),
    check('email')
      .trim()
      .escape()
      .exists()
      .withMessage('Email is required')
      .bail()
      .isEmail()
      .withMessage('Please supply a valid email')
      .bail()
      .normalizeEmail()
      .custom((value) => {
        return MongoUser.findOne({ email: value }).then((user) => {
          if (user) {
            return Promise.reject('E-mail already in use');
          }
        });
      })
      .bail(),
    check('password')
      .trim()
      .escape()
      .exists()
      .isLength({ min: 1 })
      .withMessage('Password is required')
      .bail(),
    check('image')
      .custom((value, { req }) => {
        const allow_format = ['image/png', 'image/jpeg'];

        if (
          req.files &&
          req.files.image &&
          allow_format.indexOf(req.files.image.mimetype) == -1
        ) {
          return Promise.reject('Please upload jpg or png image');
          // if image is not jpeg & png return false
        } else {
          // if no image return true
          return Promise.resolve('ok');
        }
      })
      .bail(),
  ],

  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Display sanitized values/errors messages.
      return apiResponses.failResponse(
        res,
        'Validation Error.',
        errors.array()
      );
    } else {
      let filepath = '';
      const userData = new MongoUser({
        name: req.body.name,
        email: req.body.email,
      });

      if (req.files && req.files.image) {
        const file = req.files.image;
        const timed = Date.now();
        let dir = 'public/uploads/';
        if (!fs.existsSync('./' + dir)) {
          // Create folder if not exist
          fs.mkdirSync('./' + dir);
        }

        file.mv(dir + timed + '-' + file.name, function (ferr, fresult) {
          // Move file to folder
          if (ferr) return apiResponses.failResponse(res, 'Error: ' + ferr);
          filepath = dir + timed + '-' + file.name;
          userData.image = filepath;
          return saveUser(res, userData, req.body.password);
        });
      } else {
        return saveUser(res, userData, req.body.password);
      }
    }
  },
];

/**
 *  Common function for saving user in MongoDB
 *
 * @param {Object}      res
 *
 * @param {Object}      userData
 *
 * @param {Object}      password
 *
 * @returns {Object}
 */
function saveUser(res, userData, password) {
  bcrypt.hash(password, 10, function (err, hash) {
    userData.password = hash;
    userData
      .save()
      .then((result) => {
        let respd = result.toObject(); // Converting to regular JS obj
        delete respd.password;

        return apiResponses.successResponse(
          res,
          'User added successfully',
          respd
        );
      })
      .catch((err) => {
        return apiResponses.failResponse(res, 'Error: ' + err);
      });
  });
}

/**
 * For User login.
 *
 */
exports.login = [
  check('email')
    .trim()
    .escape()
    .exists()
    .withMessage('Email is required')
    .bail()
    .isEmail()
    .withMessage('Please supply a valid email')
    .bail()
    .normalizeEmail(),
  check('password')
    .trim()
    .escape()
    .exists()
    .isLength({ min: 1 })
    .withMessage('Password is required')
    .bail(),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponses.failResponse(
          res,
          'Validation Error.',
          errors.array()
        );
      } else {
        MongoUser.findOne({ email: req.body.email }).then((user) => {
          if (user) {
            //Compare given password with db's hash.
            bcrypt.compare(
              req.body.password,
              user.password,
              function (err, same) {
                if (same) {
                  // Check User's account active or not.

                  let userData = {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                  };
                  //Prepare JWT token for authentication
                  const jwtPayload = userData;
                  const ai = 'soprano.ai';
                  const signOptions = {
                    issuer: ai,
                    subject: user.email,
                    audience: ai,
                    algorithm: process.env.JWT_ALGORITHM,
                    expiresIn: process.env.JWT_TIMEOUT_DURATION,
                  };
                  const secret = process.env.JWT_SECRET;
                  //Generated JWT token with Payload and secret.
                  userData.token = jwt.sign(jwtPayload, secret, signOptions);
                  return apiResponses.successResponse(
                    res,
                    'Login Success.',
                    userData
                  );
                } else {
                  return apiResponses.failResponse(
                    res,
                    'Email or Password wrong.'
                  );
                }
              }
            );
          } else {
            return apiResponses.failResponse(res, 'Email or Password wrong.');
          }
        });
      }
    } catch (err) {
      return apiResponses.failResponse(res, err);
    }
  },
];
