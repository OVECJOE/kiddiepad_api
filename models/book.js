const mongoose = require('mongoose');
const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const book = new Schema({
    title: {
        type: String,
        required: true,
        maxlength: 255,
        trim: true,
        unique: true
    },
    authorId: { type: ObjectId, ref: 'User' },
    noOfChapters: { type: Number, default: 0 },
    category: { type: String, required: true, trim: true },
    cover: { data: Buffer, contentType: String },
    published: { type: Boolean, default: false },
    desc: {
        type: String,
        required: true,
        alias: 'description',
        maxlength: 3000,
        trim: true,
    },
    price: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    audience: {
        type: String,
        required: true,
        enum: ['kids', 'children', 'teens', 'adults'],
        default: 'kids'
    },
    chapters: [
        { type: ObjectId, ref: 'Chapter' }
    ],
    reviews: [
        { type: ObjectId, ref: 'Review' }
    ],
}, {
    timestamps: { createdAt: 'createdOn', updatedAt: 'updatedOn' }
}, {
    toObject: {
        transform: function (doc, ret) {
            delete ret._id;
        }
    },
    toJSON: {
        transform: function (doc, ret) {
            delete ret._id;
        }
    }
});

module.exports = mongoose.model('Book', book);