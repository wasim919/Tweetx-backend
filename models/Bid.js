const mongoose = require('mongoose');
const colors = require('colors');

const BidSchema = new mongoose.Schema({
  auctionitem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionItem',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bidAmount: {
    type: Number,
    required: [true, 'Please enter the bid amount'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Bid', BidSchema);
