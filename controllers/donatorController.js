require("dotenv").config();
const Donator = require('../models/donator');
const User = require('../models/user');

exports.support_project_or_writer = (req, res) => {
    const { userId } = req.params;
    const { amount, type } = req.body;

    (type === 'project' || type === 'writer') ?
        User.findOne({ _id: userId }, (err, user) => {
            if (err) {
                res.status(500).send(
                    { error: 'Could not find user at the moment, try again.' }
                );
            } else {
                if (!user) {
                    res.status(404).send(
                        { error: 'User with given id not found.' }
                    );
                } else {
                    Donator.findOneAndUpdate({ userId }, {
                        $inc: { totalDonations: amount },
                        $addToSet: {
                            history: {
                                type, amount, timestamp: Date()
                            }
                        }
                    }, { new: true }, (err, donator) => {
                        if (err) {
                            res.status(500).send(
                                { error: 'Failed to update/create donator, check that amount param was passed.' }
                            );
                        } else {
                            let donor;

                            if (donator) {
                                donor = donator;
                            } else {
                                Donator.create({
                                    userId: user._id,
                                    history: [
                                        { type, amount, timestamp: Date() },
                                    ],
                                    totalDonations: amount
                                }, (err, newDonator) => {
                                    if (err) {
                                        res.status(500).send(
                                            { error: err.message }
                                        );
                                    } else {
                                        donor = newDonator;
                                    }
                                });
                            }

                            if (donor) {
                                user.updateOne({}, { $set: {isDonator: true} }, (err) => {
                                    if (err) {
                                        res.status(500).send(
                                            {error: 'Could not update user.'}
                                        );
                                    } else {
                                        if (type === 'project') {
                                            res.send({
                                                success: true,
                                                url: process.env.PROJECT_DONATION_LINK,
                                                donator: donor
                                            });
                                        } else {
                                            res.send({
                                                success: true,
                                                message: 'Feature coming soon',
                                                donator: donor
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    });
                }
            }
        }) : res.status(400).send(
            { error: "type parameter must be in ['project', 'writer']" }
        )
}

exports.delete_donator = (req, res) => {
    const { userId } = req.params;

    Donator.findOneAndDelete({ userId }, (err, donator) => {
        if (err) {
            res.status(404).send(
                {error: `Could not find donator with user id: ${userId}`}
            );
        } else {
            User.updateOne({ _id: userId }, {
                $set: {isDonator: false}
            }, (err) => {
                if (err) {
                    res.status(500).send(
                        {error: 'Could not update user with changes.'}
                    );
                } else {
                    res.send(donator);
                }
            })
        }
    });
};