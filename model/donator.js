const mongoose = require('mongoose');
const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const donator = Schema({
    userId: { type: ObjectId, ref: 'User' },
    totalDonations: { type: Number, default: 0 },
    history: [
        {
            type: {
                type: String,
                enum: ['project', 'writer'],
            },
            amount: Number,
            timestamp: {
                type: Date,
                required: true
            }
        }
    ]
}, {
    timestamps: {
        createdAt: 'started',
        updatedAt: 'lastDonation'
    }
});

module.exports = mongoose.model('Donator', donator);