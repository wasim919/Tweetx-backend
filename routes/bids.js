const express = require('express');
const {
  getBids,
  createBid,
  getBid,
  updateBid,
  deleteBid,
} = require('../controllers/bids');
const { protect } = require('../middleware/auth');

const Bid = require('../models/Bid');

const advancedResults = require('../middleware/advancedResults');

// You must pass {mergeParams: true} to the child router
// if you want to access the params of the parent router.

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(
    advancedResults(Bid, {
      path: 'auctionitems',
      select: 'name description',
    }),
    getBids
  )
  .post(protect, createBid);

router
  .route('/:id')
  .get(getBid)
  .put(protect, updateBid)
  .delete(protect, deleteBid);

module.exports = router;
