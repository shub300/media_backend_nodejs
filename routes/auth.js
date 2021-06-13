const express = require('express');
const AuthController = require('../controllers/AuthController');

var router = express.Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.AddUser);

module.exports = router;
