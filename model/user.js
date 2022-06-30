const mongoose = require('mongoose');
const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const user = new Schema({
    firstName: { type: String, required: true, maxlength: 100 },
    lastName: { type: String, required: true, maxlength: 100 },
    username: {
        type: String,
        required: true,
        unique: true,
        maxlength: 100
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        required: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please fill a valid email address']
    },
    birthDate: { type: Date, required: true },
    password: { type: String, required: true, trim: true },
    token: { type: String },
    isWriter: { type: Boolean, default: false },
    isVolunteer: { type: Boolean, default: false },
    bio: { type: String, maxlength: 2000, trim: true },
    photo: { data: Buffer, contentType: String },
    location: String,
    followers: { type: Number, default: 0 },
    acceptDonation: { type: Boolean, default: false },
    startedWriting: Date,
    books: [
        { type: ObjectId, ref: 'Book' }
    ],
}, { timestamps: { createdAt: 'dateJoined', updatedAt: 'lastLogin' } });

module.exports = mongoose.model('User', user);