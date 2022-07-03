const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register_user = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            username,
            email,
            birthDate,
            password
        } = req.body; // Get user's input

        if (!(firstName && lastName && username && email
            && birthDate && password)) {
            res.status(400).send(
                { error: 'All input is required' }
            );
        }

        const oldUser = await User.findOne({ email });

        if (oldUser) {
            return res.status(409).send(
                { error: 'User already exist. Please Login!' }
            );
        }

        encryptedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            firstName,
            lastName,
            username,
            email: email.toLowerCase(),
            birthDate,
            password: encryptedPassword
        });

        const token = jwt.sign(
            { user_id: user._id, email },
            process.env.TOKEN_KEY,
            { expiresIn: '1d' }
        );

        user.token = token;

        res.send(user);

    } catch (err) {
        res.status(500).send(
            { error: 'Cannot register user at the moment, try again later.' }
        );
    }
};

exports.login_user = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!(email && password)) {
            res.status(400).send(
                { error: 'All input is required.' }
            );
        }

        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign(
                { user_id: user._id, email },
                process.env.TOKEN_KEY,
                {
                    expiresIn: '1d',
                }
            );

            user.token = token;

            res.send(user);
        } else {
            res.status(400).send(
                { error: 'Invalid Credentials' }
            );
        }
    } catch (err) {
        res.status(500).send(
            { error: 'Cannot login at the moment, try again later.' }
        );
    }
};

exports.get_users = (req, res) => {
    User.find({}, (err, users) => {
        if (err) {
            res.status(500).send(
                {error: 'Could not get the list of users.'}
            );
        } else {
            res.send(users);
        }
    });
};

exports.get_user_details = (req, res) => {
    const { userId } = req.params;

    User.findOne({ _id: userId }, (err, user) => {
        if (err) {
            res.status(500).send(
                {error: 'Could not get the user details.'}
            );
        } else {
            if (!user) {
                res.status(404).send(
                    {error: 'User with given id not found.'}
                );
            } else {
                res.send(user);
            }
        }
    });
};

exports.delete_non_writer = (req, res) => {
    const { userId } = req.params;

    User.findOne({ _id: userId }, (err, user) => {
        if (err) {
            res.status(404).send(
                { error: 'User with given id not found.' }
            );
        } else {
            if (!user) {
                res.status(404).send(
                    { error: 'User with given id not found.' }
                );
            } else {
                if (user.isWriter) {
                    res.status(400).send(
                        { error: 'Could delete a writer.' }
                    );
                } else {
                    User.deleteOne({ _id: userId }, (err) => {
                        if (err) {
                            res.status(500).send(
                                { error: 'Could not delete user at the moment.' }
                            );
                        } else {
                            res.send(user);
                        }
                    });
                }
            }
        }
    });
}

exports.follow_or_unfollow_writer = (req, res) => {
    const { userId, writerId } = req.params;

    User.findOne({ _id: userId }, (err, user) => {
        if (err) {
            res.status(404).send(
                { error: 'User with given id not found.' }
            );
        } else {
            User.findOne({ _id: writerId, isWriter: true }, (err, writer) => {
                if (err) {
                    res.status(404).send(
                        { error: 'Writer with given id not found.' }
                    );
                } else {
                    if (!writer) {
                        res.status(404).send(
                            { error: 'User with given id is not a writer' }
                        );
                    } else {
                        const fIdx = writer.followers.indexOf(user._id);

                        if (fIdx === -1) {
                            writer.followers.push(user._id);
                            writer.noOfFollowers += 1;

                        } else {
                            writer.followers.splice(fIdx, 1);
                            writer.noOfFollowers -= 1;
                        }

                        writer.save((err) => {
                            if (err) {
                                res.status(500).send(
                                    { error: 'Could not save changes at the moment, try again.' }
                                );
                            } else {
                                res.send(writer);
                            }
                        });
                    }
                }
            });
        }
    });
};