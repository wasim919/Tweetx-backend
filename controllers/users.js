const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Post = require('../models/Post');
const User = require('../models/User');

// @desc        Get all users
// @route       GET /api/v1/users
// @access      Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc        Get single user
// @route       GET /api/v1/users/:id
// @access      Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc        Update user
// @route       PUT /api/v1/users/:id
// @access      Private/admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc        Create user
// @route       POST /api/v1/users
// @access      Private/admin
exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);
  res.status(201).json({
    success: true,
    data: user,
  });
});

// @desc        Delete user
// @route       DELETE /api/v1/users/:id
// @access      Private/admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndDelete(req.params.id);
  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc            Get Post corresponding to a specific user
// @route           Get /api/v1/users/posts/:userId
// @access          Private
exports.getUserPost = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return new ErrorResponse(`User not found`, 400);
  }
  if (req.user.id !== user._id.toString()) {
    return new ErrorResponse(
      `User with id: ${req.params.id} is not authorized to access this channel`,
      401
    );
  }
  const posts = await Post.find({ user: req.user.id });
  if (!posts) {
    return new ErrorResponse(
      `User with id: ${req.params.id} has not created any post yet`,
      404
    );
  }
  res.status(200).json({
    success: true,
    data: posts,
  });
});
