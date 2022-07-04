const Book = require('../models/book');
const Chapter = require('../models/chapter');

exports.create_chapter = (req, res) => {
    Book.findOne({ _id: req.params.bookId }, (err, book) => {
        if (err) {
            res.status(400).send(
                { error: 'Could not find book; Check that book id is valid.' }
            );
        } else {
            if (!req.body.body) {
                res.status(403).send(
                    { error: 'chapter body must be provided.' }
                );
            } else if (!book) {
                res.status(404).send(
                    { error: 'Book not found.' }
                );
            } else {
                if (Object.keys(req.body).length > 2) {
                    res.status(405).send(
                        { error: 'valid parameters are title and body.' }
                    );
                    return;
                }
                Chapter.create({
                    ...req.body,
                    bookId: req.params.bookId,
                    number: book.chapters.length + 1,
                    noOfPages: Math.ceil(req.body.body.length / 500)
                }, (err, newChapter) => {
                    if (err) {
                        res.status(500).send(
                            {
                                error: 'Check that chapter title or body is not duplicated.' }
                        );
                    } else {
                        Book.updateOne({ _id: req.params.bookId },
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
};

exports.delete_chapter = (req, res) => {
    const chapterId = req.params.chapterId;

    Chapter.findOneAndDelete({ _id: chapterId }, (err, chapter) => {
        if (err) {
            res.status(500).send(
                { error: 'Could not delete chapter; Check that chapter id is valid.' }
            );
        } else {
            if (!chapter || !chapter.bookId) {
                res.status(404).send(
                    { error: 'Chapter with given id does not exist.' }
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
};

exports.update_chapter = (req, res) => {
    const { chapterId } = req.params;
    const { content } = req.body;

    if (!content) {
        res.status(400).send(
            { error: 'content to update chapter is needed.' }
        );
    } else {
        Chapter.findOne({ _id: chapterId }, (err, chapter) => {
            if (err) {
                res.status(500).send(
                    { error: 'Could not update chapter with new content.' }
                );
            } else {
                if (chapter.body === content) {
                    res.status(417).send(
                        { error: 'content is the same as the chapter body.' }
                    );
                } else {
                    chapter.body = content;
                    chapter.noOfPages = Math.ceil(content.length / 500);
                    chapter.save((err, updatedChapter) => {
                        if (err) {
                            res.status(500).send(
                                { error: `Could not save changes on chapter ${chapter.number}.` }
                            );
                        } else {
                            res.send(updatedChapter);
                        }
                    });
                }
            }
        });
    }
};