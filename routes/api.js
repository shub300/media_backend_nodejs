const express = require('express');
const users = require('./users');
const posts = require('./posts');
const auth = require('./auth');

const app = express();

app.use('/users/', users);
app.use('/posts/', posts);
app.use('/auth/', auth);

module.exports = app;
