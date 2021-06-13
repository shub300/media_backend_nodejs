const jwt = require('express-jwt');
const secret = process.env.JWT_SECRET;
const algorithm = process.env.JWT_ALGORITHM;

const authenticate = jwt({
  secret: secret,
  algorithms: [algorithm],
});
// console.log(authenticate);
module.exports = authenticate;
