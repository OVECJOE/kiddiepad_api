const User = require('../models/user');
const Book = require('../models/book');
const Review = require('../models/review');

exports.create_review = (req, res) => {
    const { userId, bookId, rating, comment } = req.body;

    User.findOne({ _id: userId }, (err, user) => {
        if (err) {
            res.status(404).send(
                { error: 'Could not find user with given id.' }
            );
        } else {
            Book.findOne({ _id: bookId }, (err, book) => {
                if (err) {
                    res.status(404).send(
                        { error: 'Could not find book with given id.' }
                    );
                } else {
                    if (!rating && !comment) {
                        res.status(400).send(
                            { error: 'rating or comment is needed.' }
                        );
                    } else {
                        Review.create({
                            userId: user._id,
                            bookId: book._id,
                            ratingScore: rating,
                            comment
                        }, (err, newReview) => {
                            if (err) {
                                res.status(500).send(
                                    { error: 'Could not create new review at the moment, try again.' }
                                );
                            } else {
                                book.reviews.push(newReview._id);
                                book.save((err) => {
                                    if (err) {
                                        res.status(500).send(
                                            { error: 'Could not update book with changes' }
                                        );
                                    } else {
                                        res.send(newReview);
                                    }
                                });
                            }
                        });
                    }
                }
            });
        }
    });
};

exports.delete_review = (req, res) => {
    const { reviewId } = req.params;

    Review.findOneAndDelete({ _id: reviewId }, (err, review) => {
        if (err) {
            res.status(400).send(
                { error: 'Could not delete review, check that review id is correct.' }
            );
        } else {
            if (!review) {
                res.status(404).send(
                    { error: 'Could not find review with given id.' }
                );
            } else {
                Book.updateOne({ _id: review.bookId }, {
                    $pull: { reviews: review._id }
                }, (err) => {
                    if (err) {
                        res.status(500).send(
                            { error: 'Could not update book with changes.' }
                        );
                    } else {
                        res.send(review);
                    }
                });
            }
        }
    });
};