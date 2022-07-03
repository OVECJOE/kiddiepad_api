const mongoose = require('mongoose');
const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const chapter = new Schema({
    bookId: { type: ObjectId, ref: 'Book' },
    number: { type: Number, required: true, default: 1 },
    noOfPages: { type: Number, default: 1 },
    title: {
        type: String,
        maxlength: 255,
        unique: true,
        sparse: true
    },
    body: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
});

module.exports = mongoose.model('Chapter', chapter);