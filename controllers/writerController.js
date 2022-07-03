const User = require('../models/user');
const computeAge = require('../utils');

exports.become_writer = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user && !user.isWriter) {
        const age = computeAge(user.birthDate);
        if (age >= 18) {
            res.status(400).send(
                { error: 'You are not eligible to become a KiddiePad writer. Must be less than 18 years.' }
            );
        } else {
            const { bio, location } = req.body;
            if (!bio || !location) {
                res.status(409).send(
                    { error: "Both user's bio and location are required." }
                );
            } else {
                user.isWriter = true;
                user.bio = bio;
                user.location = location;
                user.startedWriting = Date();

                user.save((err, updatedUser) => {
                    if (err) {
                        res.status(500).send(
                            { error: 'Could not create writer; Try again.' }
                        );
                    } else {
                        res.send(updatedUser);
                    }
                });
            }
        }
    } else if (user && user.isWriter) {
        res.status(400).send(
            { error: 'User is already a writer.' }
        );
    } else {
        res.status(404).send(
            { error: 'User not found.' }
        )
    }
};

exports.get_writers = (req, res) => {
    User.find({ isWriter: true }).populate({ path: 'books', model: 'Book' })
        .populate({ path: 'followers', model: 'User' })
        .exec((err, writers) => {
            if (err) {
                res.status(500).send(
                    { error: 'Could not get the list of writers.' }
                );
            } else {
                res.send(writers);
            }
        });
};

exports.get_writer_details = (req, res) => {
    const { writerId } = req.params;

    User.findOne({ _id: writerId, isWriter: true })
        .populate({ path: 'books', model: 'Book' })
        .populate({ path: 'followers', model: 'User' })
        .exec((err, writer) => {
            if (err) {
                res.status(500).send(
                    { error: "Could not get writer's details." }
                );
            } else {
                if (writer) {
                    res.send(writer);
                } else {
                    res.status(404).send(
                        { error: 'Writer with given id not found.' }
                    );
                }
            }
        });
};
