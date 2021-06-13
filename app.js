const express = require('express');
const path = require('path');
require('dotenv').config();
const cors = require('cors');
const apiResponses = require('./helpers/apiResponses');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const apiRouter = require('./routes/api');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
app.use(cors()); // Middleware cors
app.use(fileUpload()); // Using as router middleware

app.use(express.json()); //  for Parsing json
// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse requests of content-type - application/json
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public'))); // For setting base path of the application

const port = process.env.PORT || 5000; // Express server settings
const uri = process.env.ATLAS_URI;

app.set('port', port);

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    createIndexes: true,
    useFindAndModify: false,
  })
  .then(() => {
    //don't show the log when it is test
    if (process.env.APP_ENV == 'local') {
      console.log('Mongo Is Connected');
    }
  })
  .catch((err) => {
    console.error('App starting error:', err.message);
    process.exit(1);
  });

app.listen(app.get('port'), function () {
  console.log('Express server listening on port %d mode', app.get('port'));
});

app.use('/api/', apiRouter);

// throw 404 if URL not found
app.all('*', function (req, res) {
  return apiResponses.notFoundResponse(res, 'Page not found');
});

app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    return apiResponses.unAuthorizedResponse(res, 'Invalid access token');
  }
});
