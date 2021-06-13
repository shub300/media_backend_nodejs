const MongoUser = require('../model/user.model');
const apiResponses = require('../helpers/apiResponses');

/**
 * Returns User List.
 *
 */
exports.UserList = (req, res) => {
  MongoUser.find()
    .sort({ createdAt: -1 }) // Orderby DESC
    .then((user) => apiResponses.successResponse(res, 'User Found', user))
    .catch((err) => apiResponses.failResponse(res, 'Error: ' + err));
};

/**
 * Returns User by Id.
 *
 */
exports.UserById = (req, res) => {
  MongoUser.findById(req.params.id)
    .then((user) => {
      if (user) apiResponses.successResponse(res, 'User Found', user);
      else apiResponses.failResponse(res, 'Error: User Not Found');
    })
    .catch((err) => apiResponses.failResponse(res, 'Error: ' + err));
};
