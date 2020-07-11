const AuctionItem = require('../models/AuctionItem');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Bid = require('../models/Bid');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// @desc            Get all auctionitems
// @route           GET /api/v1/auctionitems
// @access          Public
exports.getAuctionItems = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc            Get auctionitem
// @route           GET /api/v1/auctionitems/:id
// @access          Public
exports.getAuctionItem = asyncHandler(async (req, res, next) => {
  const auctionitem = await AuctionItem.findById(req.params.id);
  if (!auctionitem) {
    return next(
      new ErrorResponse(
        `AuctionItem not found with id of ${req.params.id}`,
        404
      )
    );
  }
  res.status(200).json({ success: true, data: auctionitem });
});

// @desc            Post auctionitem
// @route           POST /api/v1/auctionitems
// @access          Private
exports.createAuctionItem = asyncHandler(async (req, res, next) => {
  req.body.user = req.user;
  const startTime = Date.now();
  req.body.endTime = startTime + process.env.END_TIME * 60 * 60 * 1000;

  const auctionitem = await AuctionItem.create(req.body);
  res.status(201).json({ success: true, data: auctionitem });
});

// @desc            Update AuctionItem
// @route           PUT /api/v1/auctionitems/:id
// @access          Private
exports.updateAuctionItem = asyncHandler(async (req, res, next) => {
  let auctionitem = await AuctionItem.findById(req.params.id);
  if (!auctionitem) {
    return next(
      new ErrorResponse(
        `AuctionItem not found with id of ${req.params.id}`,
        404
      )
    );
  }

  if (req.body.amount && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Only admin can update the cost`), 401);
  }
  if (
    auctionitem.user.toString() !== req.user.id ||
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User with id ${req.user.id} is not authorized to update auctionitem`,
        401
      )
    );
  }
  auctionitem = await AuctionItem.findOneAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ success: true, data: auctionitem });
});

// @desc            Delete AuctionItem
// @route           DELETE /api/v1/auctionitems/:id
// @access          Private
exports.deleteAuctionItem = asyncHandler(async (req, res, next) => {
  const auctionitem = await AuctionItem.findById(req.params.id);
  // Check if auctionitem exists
  if (!auctionitem) {
    return res.status(400).json({ success: false });
  }
  // Make sure the auctionitem is created by the current user
  if (auctionitem.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User with id ${req.user.id} is not authorized to delete auctionitem`,
        401
      )
    );
  }
  auctionitem.remove();
  res.status(200).json({ success: true, data: {} });
});

// @desc            Find auction item winner
// @route           DELETE /api/v1/auctionitems/:auctionItemId/winner
// @access          Private admin
exports.getWinner = asyncHandler(async (req, res, next) => {
  const auctionitem = await AuctionItem.findById(req.params.auctionItemId);
  if (!auctionitem) {
    return next(
      new ErrorResponse(
        `Auction Item not found with id of ${req.params.auctionItemId}`,
        404
      )
    );
  }
  const bids = await Bid.find({ auctionitem: req.params.auctionItemId });
  const { maxUser, maxBid } = findMax(bids);
  auctionitem.winner = maxUser;
  auctionitem.winnerBid = maxBid;
  auctionitem.save();
  const winnerBidAmount = await Bid.findById(maxBid);
  res.status(200).json({
    success: true,
    data: winnerBidAmount,
  });
});

// @desc        Send email
// @route       GET /api/v1/auctionitems/:auctionItemId/sendEmail
// @access      Private admin
exports.sendEmail = asyncHandler(async (req, res, next) => {
  const auctionitem = await AuctionItem.findById(req.params.auctionItemId);
  if (!auctionitem) {
    return next(
      new ErrorResponse(
        `Auction Item not found with id of ${req.params.auctionItemId}`,
        404
      )
    );
  }
  if (!auctionitem.winner) {
    return next(
      new ErrorResponse(
        `Auction item with id of ${req.params.auctionItemId} does not have a winner yet`,
        404
      )
    );
  }
  const bidsForItem = await Bid.find({ auctionitem: req.params.auctionItemId });
  const winnerUser = await User.findById(auctionitem.winner);
  const usersBidded = bidsForItem.map((el) => el.user);
  const userEmails = getUserEmails(usersBidded);
  // console.log(await userEmails);
  // var userEmailsUnique = (await userEmails).filter(function (item, index) {
  //   return userEmails.indexOf(item) >= index;
  // });

  // Send mail to winner
  const winnerMessage = `Congratulations your bid for item ${auctionitem.name} has been successful`;
  sendEmailToUser(winnerUser.email, winnerMessage);

  // Send mail to other users who bidded for the item
  for (let i = 0; i < (await userEmails).length; ++i) {
    let email = (await userEmails)[i].email;
    if (email != winnerUser.email) {
      const message = `You are receiving this email because your bid was not successfull`;
      sendEmailToUser(email, message);
    }
  }
  res.status(200).json({
    success: true,
  });
});

const sendEmailToUser = async (email, message) => {
  try {
    await sendMail({
      email: email,
      subject: 'Thanks for dealing with us',
      message,
    });
    return res.status(200).json({
      success: true,
      data: 'Email sent',
    });
  } catch (error) {
    console.log(error);

    return next(new ErrorResponse('Email could not be sent', 500));
  }
};

const sendMail = async (options) => {
  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  const info = await transporter.sendMail(message);

  console.log('Message sent: %s', info.messageId);
};

const getUserEmails = async (usersBidded) => {
  const userEmails = [];
  for (let i = 0; i < usersBidded.length; ++i) {
    userEmails[i] = await User.findOne(usersBidded[i]).select('email');
  }
  return userEmails;
};

const findMax = (bids) => {
  let maxAmount = bids[0].bidAmount;
  let maxUser = bids[0].user;
  let maxBid = bids[0]._id;
  for (let i = 1; i < bids.length; ++i) {
    if (bids[i].bidAmount > maxAmount) {
      maxAmount = bids[i].bidAmount;
      maxUser = bids[i].user;
      maxBid = bids[i]._id;
    }
  }
  return {
    maxUser,
    maxBid,
  };
};
