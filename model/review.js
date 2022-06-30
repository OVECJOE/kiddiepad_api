const mongoose = require('mongoose');
const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const review = new Schema({
    userId: { type: ObjectId, ref: 'User' },
    ratingScore: { type: Number, min: 0, max: 5, required: true },
    comment: { type: String, maxlength: 500, trim: true },
    bookId: { type: ObjectId, ref: 'Book' },
    votes: { type: Number, default: 0 },
}, {
    timestamps: { createdAt: 'reviewedOn' }
});

module.exports = mongoose.model('Review', review);