const express = require('express');
const UsersController = require('../controllers/UserController');

var router = express.Router();

router.get('/', UsersController.UserList);
router.get('/:id', UsersController.UserById);

module.exports = router;
