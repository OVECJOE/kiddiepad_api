require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Importing the middlewares
const auth = require('./middleware/auth');

// Importing routes
const usersRouter = require('./routes/users');
const booksRouter = require('./routes/books');

const app = express();

app.use(express.json({ limit: '50mb' }));

// uses the users route.
app.use('/api/v1', usersRouter);

// uses the books route.
app.use('/api/v1', booksRouter);


// for non-available endpoints or routes
app.use('*', (req, res) => {
    res.status(404).send({
        error: 'You reached a route that is not defined on the server',
    });
});

module.exports = app;