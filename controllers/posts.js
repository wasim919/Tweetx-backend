const Post = require('../models/Post');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// @desc            Get all posts
// @route           GET /api/v1/posts
// @access          Public
exports.getPosts = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc            Get post
// @route           GET /api/v1/posts/:id
// @access          Public
exports.getPost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return next(
      new ErrorResponse(`Post not found with id of ${req.params.id}`, 404)
    );
  }
  res.status(200).json({ success: true, data: post });
});

// @desc            Post post
// @route           POST /api/v1/posts
// @access          Private
exports.createPost = asyncHandler(async (req, res, next) => {
  req.body.user = req.user;

  const post = await Post.create(req.body);
  res.status(201).json({ success: true, data: post });
});

// @desc            Update post
// @route           PUT /api/v1/posts/:id
// @access          Private
exports.updatePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.params.id);
  if (!post) {
    return next(
      new ErrorResponse(`Post not found with id of ${req.params.id}`, 404)
    );
  }

  if (post.user.toString() !== req.user.id || req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User with id ${req.user.id} is not authorized to update post`,
        401
      )
    );
  }
  post = await Post.findOneAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ success: true, data: post });
});

// @desc            Delete Post
// @route           DELETE /api/v1/posts/:id
// @access          Private
exports.deletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  // Check if post exists
  if (!post) {
    return res.status(400).json({ success: false });
  }
  // Make sure the post is created by the current user
  if (post.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User with id ${req.user.id} is not authorized to delete post`,
        401
      )
    );
  }
  post.remove();
  res.status(200).json({ success: true, data: {} });
});
