require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Importing the models
const User = require('./model/user');
const Book = require('./model/book');
const Chapter = require('./model/chapter');
const Review = require('./model/review');
const auth = require('./middleware/auth');
const computeAge = require('./utils');

const app = express();

app.use(express.json({ limit: '50mb' }));

// register user endpoint
app.post('/api/register', async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            username,
            email,
            birthDate,
            password
        } = req.body; // Get user's input

        if (!(firstName && lastName && username && email
            && birthDate && password)) {
            res.status(400).send(
                { error: 'All input is required' }
            );
        }

        const oldUser = await User.findOne({ email });

        if (oldUser) {
            return res.status(409).send(
                { error: 'User already exist. Please Login!' }
            );
        }

        encryptedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            firstName,
            lastName,
            username,
            email: email.toLowerCase(),
            birthDate,
            password: encryptedPassword
        });

        const token = jwt.sign(
            { user_id: user._id, email },
            process.env.TOKEN_KEY,
            { expiresIn: '1d' }
        );

        user.token = token;

        res.send(user);

    } catch (err) {
        res.status(500).send(
            { error: 'Cannot register user at the moment, try again later.' }
        );
    }
});

// login user endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!(email && password)) {
            res.status(400).send(
                { error: 'All input is required.' }
            );
        }

        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign(
                { user_id: user._id, email },
                process.env.TOKEN_KEY,
                {
                    expiresIn: '1d',
                }
            );

            user.token = token;

            res.send(user);
        } else {
            res.status(400).send(
                { error: 'Invalid Credentials' }
            );
        }
    } catch (err) {
        res.status(500).send(
            { error: 'Cannot login at the moment, try again later.' }
        );
    }
});

// become writer endpoint
app.post('/api/register/writer', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user && !user.isWriter) {
        const age = computeAge(user.birthDate);
        if (age >= 18) {
            res.status(400).send(
                { error: 'You are not eligible to become a KiddiePad writer. Must be less than 18 years.' }
            );
        }
        const { bio, location } = req.body;
        if (!bio || !location) {
            res.status(409).send(
                { error: "Both user's bio and location are required." }
            );
        }
        user.isWriter = true;
        user.bio = bio;
        user.location = location;
        user.startedWriting = Date();

        user.save((err, updatedUser) => {
            if (err) {
                res.status(500).send(
                    { error: 'Could not create writer; Try again.' }
                );
            } else {
                res.send(updatedUser);
            }
        });
    } else if (user && user.isWriter) {
        res.status(400).send(
            { error: 'User is already a writer.' }
        );
    } else {
        res.status(404).send(
            { error: 'User not found.' }
        )
    }
});

app.post('/api/books/create_new', (req, res) => {
    const { title, category, desc, audience, authorId } = req.body;

    User.findOne({ _id: authorId }, (err, user) => {
        if (err) {
            res.status(500).send(
                { error: 'Could not find user.' }
            );
        } else {
            if (!user.isWriter) {
                res.status(400).send(
                    { error: 'User is not a registered kiddiepad writer.' }
                );
            } else {
                if (!(title && category && desc && audience)) {
                    res.status(400).send(
                        {
                            error: `title, category, desc, and audience are
                        necessary for book creation.`}
                    );
                } else {
                    Book.create({
                        title,
                        category,
                        desc,
                        audience,
                        authorId
                    }, (err, book) => {
                        if (err) {
                            res.status(404).send(
                                {
                                    error: `Could not create book; Check that book with
                                the same title does not already exist.` }
                            );
                        } else {
                            User.updateOne({ _id: authorId },
                                { $addToSet: { books: book._id } },
                                (err, _) => {
                                    if (err) {
                                        res.status(400).send(
                                            { error: 'User could not be updated, though book has been created.' }
                                        );
                                    } else {
                                        res.send(book);
                                    }
                                });
                        }
                    });
                }
            }
        }
    });
});

app.get('/api/books/:title', (req, res) => {
    const bookTitle = req.params.title;

    Book.findOne({ title: bookTitle })
        .populate({ path: 'chapters', model: 'Chapter' })
        .populate({ path: 'reviews', model: 'Review' })
        .exec((err, book) => {
            if (err) {
                res.status(500).send(
                    { error: 'Could not fetch book.' }
                )
            } else {
                res.send(book);
            }
        });
});

app.get('/api/books/search/:keyword', (req, res) => {
    const { keyword } = req.params;

    if (!keyword) {
        res.status(400).send(
            { error: 'Search keyword required to lookup books.' }
        );
    } else {
        Book.find({
            $or: [
                { title: { $regex: keyword, $options: 'i' } },
                { desc: { $regex: keyword, $options: 'i' } }
            ]
        }).populate('authorId')
            .exec((err, books) => {
                if (err) {
                    res.status(500).send(
                        { error: 'Could not get books at the moment, try again.' }
                    );
                } else {
                    res.send(
                        {
                            length: books.length,
                            result: books
                        }
                    );
                }
            });
    }
});

app.post('/api/chapters/create_new', (req, res) => {
    Book.findOne({ _id: req.body.bookId }, (err, book) => {
        if (err) {
            res.status(404).send(
                { error: 'Could not find book; Check that book id is valid.' }
            );
        } else {
            if (!req.body.body) {
                res.status(404).send(
                    { error: 'chapter body must be provided.' }
                );
            } else {
                Chapter.create({
                    ...req.body,
                    number: book.chapters.length + 1,
                    noOfPages: Math.ceil(req.body.body.length / 500)
                }, (err, newChapter) => {
                    if (err) {
                        res.status(500).send(
                            {
                                error: `Could not save new chapter; Check that chapter
                             title or body is not duplicated.` }
                        );
                    } else {
                        Book.updateOne({ _id: req.body.bookId },
                            {
                                noOfChapters: book.chapters.length + 1,
                                $addToSet: { chapters: newChapter._id }
                            },
                            (err) => {
                                if (err) {
                                    res.status(500).send(
                                        { error: 'Could not update book with new chapter.' }
                                    );
                                } else {
                                    res.send(newChapter);
                                }
                            }
                        );
                    }
                });
            }
        }
    });
});

app.delete('/api/chapters/delete/:chapterId', (req, res) => {
    const chapterId = req.params.chapterId;

    Chapter.findOneAndDelete({ _id: chapterId }, (err, chapter) => {
        if (err) {
            res.status(500).send(
                { error: 'Could not delete chapter; Check that chapter id is valid.' }
            );
        } else {
            if (!chapter || !chapter.bookId) {
                res.status(404).send(
                    { error: 'Chapter with given id does not exists.' }
                );
            } else {
                Book.findOne({ _id: chapter.bookId }, (err, book) => {
                    if (err) {
                        res.status(404).send(
                            { error: 'Could not find book with such chapter.' }
                        );
                    } else {
                        const chapters = book.chapters.filter(chapter => chapter._id != chapterId);
                        book.chapters = chapters;
                        book.save((err, book) => {
                            if (err) {
                                res.status(500).send(
                                    { error: 'Could save changes made to the book.' }
                                );
                            } else {
                                res.send(book);
                            }
                        });
                    }
                });
            }
        }
    });
});

app.use('*', (req, res) => {
    res.status(404).send({
        error: 'You reached a route that is not defined on the server',
    });
});

module.exports = app;