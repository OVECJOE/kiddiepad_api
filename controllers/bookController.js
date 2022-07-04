const User = require('../models/user');
const Book = require('../models/book');
const Chapter = require('../models/chapter');

exports.create_book = (req, res) => {
    const { title, category, desc, audience, authorId } = req.body;

    User.findOne({ _id: authorId }, (err, user) => {
        if (err) {
            res.status(500).send(
                { error: 'Could not find user.' }
            );
        } else {
            if (!user) {
                res.status(500).send(
                    { error: 'Could not find user.' }
                );
            } else {
                if (!user.isWriter) {
                    res.status(403).send(
                        { error: 'User is not a registered kiddiepad writer.' }
                    );
                } else {
                    if (!(title && category && desc && audience)) {
                        res.status(401).send(
                            {
                                error: 'title, category, desc, and audience required.'
                            }
                        );
                    } else {
                        Book.create({
                            title: title.toLowerCase(),
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
        }
    });
};

// search book by title
exports.search_book = (req, res) => {
    let bookTitle = req.params.title;

    if (bookTitle) {
        bookTitle = bookTitle.toLowerCase();
    }

    Book.findOne({ title: bookTitle })
        .populate({ path: 'chapters', model: 'Chapter' })
        .populate({ path: 'reviews', model: 'Review' })
        .exec((err, book) => {
            if (err) {
                res.status(500).send(
                    { error: 'Could not fetch book.' }
                )
            } else {
                if (book) {
                    res.send(book);
                } else {
                    res.status(404).send(
                        { error: 'Book with given title not found.' }
                    );
                }
            }
        });
};

// search books by keyword
exports.search_books = (req, res) => {
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
            .populate({ path: 'chapters', model: 'Chapter' })
            .populate({ path: 'reviews', model: 'Review' })
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
};

exports.delete_book = (req, res) => {
    const bookId = req.params.bookId;

    Book.findOne({ _id: bookId }, (err, book) => {
        if (err) {
            res.status(404).send(
                { error: 'Could not find book with given id.' }
            );
        } else {
            if (!book || !book.authorId) {
                res.status(404).send(
                    { error: 'Book with given id does not exist.' }
                );
            } else {
                book.published ?
                    res.status(400).send(
                        { error: 'A published book cannot be deleted.' }
                    ) :
                    User.findOne({ _id: book.authorId }, (err, user) => {
                        if (err) {
                            res.status(400).send(
                                { error: 'Changes could not be made to user at the moment.' }
                            );
                        } else {
                            const books = user.books.filter(book => book._id != bookId);
                            user.books = books;
                            user.save((err, user) => {
                                if (err) {
                                    res.status(400).send(
                                        { error: 'Could not save changes to user at the moment.' }
                                    );
                                } else {
                                    Chapter.deleteMany({ bookId: bookId }, (err) => {
                                        if (err) {
                                            res.status(500).send(
                                                { error: 'Could not delete chapters associated with book.' }
                                            );
                                        } else {
                                            book.deleteOne({}, (err) => {
                                                if (err) {
                                                    res.status(500).send(
                                                        { error: 'Could not delete book at the moment, try again.' }
                                                    );
                                                } else {
                                                    res.send(user);
                                                }
                                            });
                                        }
                                    })
                                }
                            });
                        }
                    });
            }
        }
    });
};

exports.publish_book = (req, res) => {
    const bookId = req.params.bookId;

    Book.findOne({ _id: bookId }, (err, book) => {
        if (err) {
            res.status(404).send(
                { error: 'Book with given id not found.' }
            );
        } else {
            book.published = true;
            book.save((err, updatedBook) => {
                if (err) {
                    res.status(500).send(
                        { error: 'Could not save requested changes on book.' }
                    );
                } else {
                    res.send(updatedBook);
                }
            });
        }
    });
};

exports.read_book = (req, res) => {
    const bookId = req.params.bookId;

    Book.findOne({ _id: bookId })
        .populate({ path: 'chapters', model: 'Chapter' })
        .populate('authorId', 'username')
        .exec((err, book) => {
            if (err) {
                res.status(500).send(
                    { error: 'Could not get book info at the moment; Try again.' }
                );
            } else {
                book.published ?
                    res.send({
                        noOfChapters: book.noOfChapters,
                        chapters: book.chapters,
                        title: book.title,
                        author: book.authorId.username
                    }) :
                    res.status(400).send(
                        { error: 'This book has not been published, hence cannot be read.' }
                    );
            }
        });
};

exports.incr_book_shares_or_views = (req, res) => {
    const { bookId, shareOrView } = req.params;

    if (shareOrView === 'view' || shareOrView === 'share') {
        Book.findOneAndUpdate({ _id: bookId, published: true },
            { $inc: { [`${shareOrView}s`]: 1 } }, { new: true },
            (err, book) => {
                if (err) {
                    res.status(500).send(
                        { error: `Could not update number of ${shareOrView}s.` }
                    );
                } else {
                    if (!book) {
                        res.status(404).send(
                            { error: 'Book with given id not found. Note that book must be published.' }
                        );
                    } else {
                        res.send(book);
                    }
                }
            });
    } else {
        res.status(400).send(
            { error: "shareOrView not in ['share', 'view']" }
        );
    }
};