const express = require('express');
const router = express.Router();

const bookController = require('../controllers/bookController');
const chapterController = require('../controllers/chapterController');
const reviewController = require('../controllers/reviewController');

// create new book endpoint
router.post('/books/create_new', bookController.create_book);

// get book by title endpoint
router.get('/books/:title', bookController.search_book);

// get books by keyword endpoint
router.get('/books/:keyword/search', bookController.search_books);

// delete a book by ID endpoint
router.delete('/books/:bookId/delete', bookController.delete_book);

// publish a book endpoint
router.put('/books/:bookId/publish', bookController.publish_book);

// read a published book endpoint
router.get('/books/:bookId/read', bookController.read_book);

// share/view book endpoint.
// This endpoint is just used to increment a published book `shares`/`views` field.
// Useful only when using your frontend logic to share/view a book.
router.put('/books/:bookId/:shareOrView', bookController.incr_book_shares_or_views);

// create new chapter endpoint
router.post('/book/chapters/create_new', chapterController.create_chapter);

// delete a given chapter using the chapter id endpoint
router.delete('/book/chapters/:chapterId/delete', chapterController.delete_chapter);

// update a chapter's content endpoint
router.put('/book/chapters/:chapterId/update', chapterController.update_chapter);

// review a book endpoint
router.post('/reviews/create_new', reviewController.create_review);

// delete a review endpoint
router.delete('/reviews/:reviewId/delete', reviewController.delete_review);

module.exports = router;