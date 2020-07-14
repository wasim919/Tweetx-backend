const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserPost,
  followUser,
  removeFollower,
  removeFollowing,
} = require('../controllers/users');
const User = require('../models/User');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

router.route('/posts/:id').get(protect, getUserPost);
router.route('/followUser/:id').get(protect, followUser);
router.route('/removeFollower/:id').get(protect, removeFollower);
router.route('/removeFollowing/:id').get(protect, removeFollowing);

router
  .route('/')
  .get(protect, advancedResults(User), getUsers)
  .post(protect, createUser);
router.use(authorize('admin'));
router
  .route('/:id')
  .get(protect, getUser)
  .put(protect, updateUser)
  .delete(protect, deleteUser);

module.exports = router;
