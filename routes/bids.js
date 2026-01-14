import express from "express"
import { protect } from "../middleware/auth.js"
import Bid from "../models/Bid.js"
import Gig from "../models/Gig.js"

const router = express.Router()

// Submit a bid
router.post("/",protect, async (req, res) => {
  try {
    const { gigId, message, bidAmount } = req.body

    if (!gigId || !message || !bidAmount) {
      return res.status(400).json({ message: "Please provide all required fields" })
    }

    // Check if gig exists and is open
    const gig = await Gig.findById(gigId)
    if (!gig) {
      return res.status(404).json({ message: "Gig not found" })
    }

    if (gig.status !== "open") {
      return res.status(400).json({ message: "This gig is no longer open" })
    }

    // Prevent owner from bidding on own gig
    if (gig.ownerId.toString() === req.user.id) {
      return res.status(400).json({ message: "Cannot bid on your own gig" })
    }

    // Check if user already bid
    const existingBid = await Bid.findOne({ gigId, freelancerId: req.user.id })
    if (existingBid) {
      return res.status(400).json({ message: "You have already bid on this gig" })
    }

    const bid = await Bid.create({
      gigId,
      freelancerId: req.user.id,
      message,
      bidAmount,
    })

    const populatedBid = await bid.populate("freelancerId", "name email avatar")
    res.status(201).json({
      success: true,
      bid: populatedBid,
      message: "Bid submitted successfully",
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get all bids for a gig (Owner only)
router.get("/:gigId",protect,  async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.gigId)

    if (!gig) {
      return res.status(404).json({ message: "Gig not found" })
    }

    // Only owner can view bids
    if (gig.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view these bids" })
    }

    const bids = await Bid.find({ gigId: req.params.gigId })
      .populate("freelancerId", "name email avatar")
      .sort({ createdAt: -1 })

    res.status(200).json({ success: true, bids })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Hire a freelancer (Atomic operation with Transaction)
router.patch("/:bidId/hire",protect,  async (req, res) => {
  const session = await Bid.startSession()
  session.startTransaction()

  try {
    const bid = await Bid.findById(req.params.bidId).session(session)

    if (!bid) {
      await session.abortTransaction()
      return res.status(404).json({ message: "Bid not found" })
    }

    const gig = await Gig.findById(bid.gigId).session(session)

    if (!gig) {
      await session.abortTransaction()
      return res.status(404).json({ message: "Gig not found" })
    }

    // Verify ownership and gig is still open
    if (gig.ownerId.toString() !== req.user.id) {
      await session.abortTransaction()
      return res.status(403).json({ message: "Not authorized to hire for this gig" })
    }

    if (gig.status !== "open") {
      await session.abortTransaction()
      return res.status(400).json({ message: "This gig is already assigned" })
    }

    // Update the chosen bid
    bid.status = "hired"
    await bid.save({ session })

    // Reject all other bids for this gig
    await Bid.updateMany({ gigId: bid.gigId, _id: { $ne: bid._id } }, { status: "rejected" }, { session })

    // Update gig status
    gig.status = "assigned"
    gig.hiredBidId = bid._id
    await gig.save({ session })

    await session.commitTransaction()

    const populatedBid = await Bid.findById(bid._id).populate("freelancerId", "name email avatar")

    // Emit real-time notification
    const io = req.app.locals.io
    if (io) {
      io.to(`user_${bid.freelancerId}`).emit("hired_notification", {
        gigTitle: gig.title,
        gigId: gig._id,
        budget: gig.budget,
      })
    }

    res.status(200).json({
      success: true,
      bid: populatedBid,
      message: "Freelancer hired successfully",
    })
  } catch (error) {
    await session.abortTransaction()
    res.status(500).json({ message: error.message })
  } finally {
    session.endSession()
  }
})

export default router
