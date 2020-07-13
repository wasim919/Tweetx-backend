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

// @desc            Follow user
// @route           Get /api/v1/users/followUser/:userId
// @access          Private
exports.followUser = asyncHandler(async (req, res, next) => {
  if (req.params.id === req.user.id) {
    return new ErrorResponse(`You can't follow yourself`, 400);
  }
  const userToBeFollowed = await User.findById(req.params.id);
  const userFollowing = await User.findById(req.user.id);
  if (!userToBeFollowed || !userFollowing) {
    return next(new ErrorResponse(`User not found`, 400));
  }
  for (let i = 0; i < userFollowing.following.length; ++i) {
    if (userFollowing.following[i].id === req.params.id) {
      console.log('hello');
      return next(
        new ErrorResponse(`You have already followed this user`, 400)
      );
    }
  }
  // if (req.user.id !== user._id.toString()) {
  //   return new ErrorResponse(
  //     `User with id: ${req.params.id} is not authorized to access this channel`,
  //     401
  //   );
  // }
  userToBeFollowed.followers.push({
    id: userFollowing._id,
    username: userFollowing.username,
    email: userFollowing.email,
  });
  userFollowing.following.push({
    id: userToBeFollowed._id,
    username: userToBeFollowed.username,
    email: userToBeFollowed.email,
  });
  await userToBeFollowed.save();
  await userFollowing.save();

  res.status(200).json({
    success: true,
  });
});

// @desc            Unfollow user
// @route           Get /api/v1/users/followUser/:userId
// @access          Private
exports.unFollowUser = asyncHandler(async (req, res, next) => {
  const userToBeUnFollowed = await User.findById(req.params.id);
  const userFollowing = await User.findById(req.user.id);
  if (!userToBeFollowed || !userFollowing) {
    return next(new ErrorResponse(`User not found`, 400));
  }
  // if (req.user.id !== user._id.toString()) {
  //   return new ErrorResponse(
  //     `User with id: ${req.params.id} is not authorized to access this channel`,
  //     401
  //   );
  // }
  let i;
  for (i = 0; i < userToBeUnFollowed.followers.length; ++i) {
    if (userToBeUnFollowed.followers[i]._id === req.user.id) {
      break;
    }
  }
  userToBeUnFollowed.followers.splice(i);
  await userToBeFollowed.save();
  for (i = 0; i < userFollowing.following.length; ++i) {
    if (userFollowing.following[i]._id === req.params.id) {
      break;
    }
  }
  userFollowing.following.splice(i);
  await userFollowing.save();
  res.status(200).json({
    success: true,
  });
});
