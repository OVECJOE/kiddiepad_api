const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const writerController = require('../controllers/writerController');
const donatorController = require('../controllers/donatorController');

// register user endpoint
router.post('/register', userController.register_user);

// login user endpoint
router.post('/login', userController.login_user);

// get all users endpoint
router.get('/users', userController.get_users);

// get user's details endpoint
router.get('/users/:userId', userController.get_user_details);

// delete user endpoint (note that you cannot delete writers)
router.delete('/users/:userId/delete', userController.delete_non_writer);

// become writer endpoint
router.put('/register/new_writer', writerController.become_writer);

// get all writers endpoint
router.get('/writers', writerController.get_writers);

// get writer's details endpoint
router.get('/writers/:writerId', writerController.get_writer_details);

// (un)follow writer endpoint
router.put('/users/:userId/follow/:writerId',
    userController.follow_or_unfollow_writer
);

// donate to project or writer endpoint
router.post('/users/:userId/donate/(:writerId)?',
    donatorController.support_project_or_writer
);

// delete donator endpoint
router.post('/donators/:userId/delete', donatorController.delete_donator);

module.exports = router;