const asyncHandler = require('../middleware/async');
const Bid = require('../models/Bid');
const AuctionItem = require('../models/AuctionItem');
const ErrorResponse = require('../utils/errorResponse');

// @desc        Get bids
// @route       GET /api/v1/bids
// @route       GET /api/v1/auctionitems/:auctionitemId/bids
// @access      Private
exports.getBids = asyncHandler(async (req, res, next) => {
  if (req.params.auctionItemId) {
    const bids = await Bid.find({
      auctionitem: req.params.auctionItemId,
    });

    res.status(200).json({
      success: true,
      count: bids.length,
      data: bids,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc        Add bid specific to an auction item
// @route       POST /api/v1/auctionitems/:auctionitemId/posts
// @access      Private
exports.createBid = asyncHandler(async (req, res, next) => {
  req.body.auctionitem = req.params.auctionItemId;
  req.body.user = req.user;

  const auctionitem = await AuctionItem.findById(req.params.auctionItemId);
  if (!auctionitem) {
    next(
      new ErrorResponse(
        `auction item does not exist with id of ${req.params.channelId}`,
        404
      )
    );
  }
  if (auctionitem.endTime < Date.now()) {
    return next(
      new ErrorResponse(`The auction for this item is over now.`, 400)
    );
  }
  // Check if the entered amount is less than the auction item starting amount
  console.log(auctionitem.startingAmount);
  if (req.body.bidAmount < auctionitem.startingAmount) {
    return next(
      new ErrorResponse(
        `The bid amount ${req.body.bidAmount} is less than the base auction item amount ${auctionitem.startingAmount}`,
        400
      )
    );
  }
  const bid = await Bid.create(req.body);

  res.status(200).json({
    success: true,
    data: bid,
  });
});

// @desc        Get single bid
// @route       GET /api/v1/bids/:bidId
// @access      Public
exports.getBid = asyncHandler(async (req, res, next) => {
  const bid = await Bid.findById(req.params.id).populate({
    path: 'channel',
    select: 'name description',
  });
  if (!bid) {
    return next(new ErrorResponse(`No bid with id of ${req.params.id}`, 404));
  }
  res.status(200).json({
    success: true,
    data: bid,
  });
});

// @desc        Update a Bid
// @route       PUT Papi/v1/bids/:id
// @access      Private
exports.updateBid = asyncHandler(async (req, res, next) => {
  let bid = await Bid.findById(req.params.id);
  if (!bid) {
    return next(new ErrorResponse(`No bid with id of ${req.params.id}`, 404));
  }
  if (bid.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User with id ${req.user.id} is not authorized to update bid ${post._id}`,
        401
      )
    );
  }
  bid = await Bid.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: bid,
  });
});

// @desc        Remove bid
// @route       DELETE /api/v1/bids/:id
// @access      Private
exports.deleteBid = asyncHandler(async (req, res, next) => {
  const bid = await Bid.findById(req.params.id);
  if (!bid) {
    return next(new ErrorResponse(`No bid with id of ${req.params.id}`, 404));
  }
  if (bid.user.toString() !== req.user.id) {
    return new ErrorResponse(
      `User with id ${req.user.id} is not authorized to delete bid ${course._id}`,
      401
    );
  }
  await bid.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});
