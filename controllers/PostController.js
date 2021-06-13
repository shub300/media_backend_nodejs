const PostInfo = require('../model/post.model');
const apiResponses = require('../helpers/apiResponses');
const { check, validationResult } = require('express-validator');
const auth = require('../middlewares/jwt');
const fs = require('fs');
const mongoose = require('mongoose');
exports.AddPost = [
  auth,
  [
    check('title')
      .trim()
      .escape()
      .exists()
      .isLength({ min: 2 })
      .withMessage('Title is required')
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
      const postData = new PostInfo({
        title: req.body.title,
        description: req.body.description,
        user_id: req.user,
      });
      if (req.files && req.files.image) {
        const file = req.files.image;
        const timed = Date.now();
        let dir = 'public/uploads/';
        if (!fs.existsSync('./' + dir)) {
          // Create directory if not exist
          fs.mkdirSync('./' + dir);
        }
        file.mv(dir + timed + '-' + file.name, function (ferr, fresult) {
          // Move file to folder
          if (ferr) return apiResponses.failResponse(res, 'Error: ' + ferr);
          filepath = dir + timed + '-' + file.name;
          postData.image = filepath;
          return savePost(postData, res);
        });
      } else {
        return savePost(postData, res);
      }
    }
  },
];

/**
 *  Common function for post add & update
 *
 * @param {Object}      postData
 *
 * @param {Object}      res
 *
 * @returns {Object}
 */
function savePost(postData, res) {
  postData
    .save()
    .then((result) => {
      let respd = result.toObject(); // Converting to regular JS obj

      return apiResponses.successResponse(
        res,
        'Post added successfully',
        respd
      );
    })
    .catch((err) => {
      return apiResponses.failResponse(res, 'Error: ' + err);
    });
}

exports.ListPosts = [
  auth,
  (req, res) => {
    PostInfo.find()
      .sort({ createdAt: -1 }) // Orderby DESC
      .then((post) => apiResponses.successResponse(res, 'Post Found', post))
      .catch((err) => apiResponses.failResponse(res, 'Error: ' + err));
  },
];

exports.ListPostsId = [
  auth,
  (req, res) => {
    PostInfo.findById(req.params.id)
      .then((post) => {
        if (post) apiResponses.successResponse(res, 'Post Found', post);
        else apiResponses.failResponse(res, 'Error: Post Not Found');
      })
      .catch((err) => apiResponses.failResponse(res, 'Error: ' + err));
  },
];

exports.UpdatePostById = [
  auth,
  [
    check('title')
      .trim()
      .escape()
      .exists()
      .isLength({ min: 2 })
      .withMessage('Title is required')
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
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return apiResponses.failResponse(res, 'Invalid ID');
    }
    PostInfo.findById(req.params.id)
      .then((post) => {
        if (post === null) {
          return apiResponses.failResponse(res, 'Post not found');
        } else if (post.user_id.toString() !== req.user._id) {
          //Check authorized user
          return apiResponses.failResponse(
            res,
            'You are not authorized to update this post'
          );
        }
        let filepath = '';
        post.title = req.body.title;
        post.description = req.body.description;
        if (req.files && req.files.image) {
          const file = req.files.image;
          const timed = Date.now();
          let dir = 'public/uploads/';
          if (!fs.existsSync('./' + dir)) {
            // Create directory if not exist
            fs.mkdirSync('./' + dir);
          }

          file.mv(dir + timed + '-' + file.name, function (ferr, fresult) {
            // Move file to folder
            if (ferr) return apiResponses.failResponse(res, 'Error: ' + ferr);
            filepath = dir + timed + '-' + file.name;
            post.image = filepath;
            return savePost(post, res);
          });
        } else {
          return savePost(post, res);
        }
      })
      .catch((err) => apiResponses.failResponse(res, 'Error: ' + err));
  },
];

exports.DeletePostById = [
  auth,
  (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return apiResponses.failResponse(res, 'Invalid ID');
    }
    PostInfo.findById(req.params.id)
      .then((post) => {
        if (post === null) {
          return apiResponses.failResponse(res, 'Post not found');
        } else if (post.user_id.toString() !== req.user._id) {
          //Check authorized user
          return apiResponses.failResponse(
            res,
            'You are not authorized to delete this post'
          );
        }
        PostInfo.findByIdAndDelete(req.params.id)
          .then((post) => {
            if (post)
              apiResponses.successResponse(res, 'Post Deleted Successfully');
            // delete record comes only first time then it returns null
            else
              apiResponses.failResponse(
                res,
                'Error: Post Not Found Or Already Deleted'
              );
          })
          .catch((err) => apiResponses.failResponse(res, 'Error: ' + err));
      })
      .catch((err) => apiResponses.failResponse(res, 'Error: ' + err));
  },
];
