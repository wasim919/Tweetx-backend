const mongoose = require('mongoose');

const AuctionItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  startingAmount: {
    type: Number,
    required: [true, 'Please add a starting amount'],
  },
  amount: {
    type: Number,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  winnerBid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid',
  },
  imageUrl: {
    type: String,
  },
});

module.exports = mongoose.model('AuctionItem', AuctionItemSchema);
