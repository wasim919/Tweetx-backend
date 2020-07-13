const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserPost,
  followUser,
  unFollowUser,
} = require('../controllers/users');
const User = require('../models/User');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

router.route('/posts/:id').get(protect, getUserPost);
router.route('/followUser/:id').get(protect, followUser);
router.route('/unFollowUser/:id').get(protect, unFollowUser);

router.use(authorize('admin'));

router.route('/').get(advancedResults(User), getUsers).post(createUser);
router.route('/:id').get(getUser).put(updateUser).delete(deleteUser);

module.exports = router;
