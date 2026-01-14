import express from "express"
import { protect } from "../middleware/auth.js"
import Gig from "../models/Gig.js"

const router = express.Router()

router.get("/", async (req, res) => {
  try {
    const { search, category, level } = req.query
    const query = { status: "open" }

    if (search) {
      query.$text = { $search: search }
    }

    if (category) {
      query.category = category
    }

    if (level) {
      query.level = level
    }

    const gigs = await Gig.find(query).populate("ownerId", "name email avatar").sort({ createdAt: -1 })

    res.status(200).json({ success: true, gigs })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post("/", protect, async (req, res) => {
  try {
    const { title, description, budget, category, skills, deadline, level, estimatedTime, minBidAmount, maxBidAmount } =
      req.body

    if (!title || !description || !budget) {
      return res.status(400).json({ message: "Please provide all required fields" })
    }

    const gig = await Gig.create({
      title,
      description,
      budget,
      category: category || "web-development",
      skills: skills || [],
      deadline: deadline || null,
      level: level || "intermediate",
      estimatedTime: estimatedTime || "1-2-weeks",
      minBidAmount: minBidAmount || 0,
      maxBidAmount: maxBidAmount || null,
      ownerId: req.user.id,
      ownerName: req.user.name,
    })

    const populatedGig = await gig.populate("ownerId", "name email avatar")
    res.status(201).json({ success: true, gig: populatedGig })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get gig by ID
router.get("/:id", async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id).populate("ownerId", "name email avatar").populate("hiredBidId")

    if (!gig) {
      return res.status(404).json({ message: "Gig not found" })
    }

    res.status(200).json({ success: true, gig })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get user's gigs
router.get("/user/my-gigs", protect, async (req, res) => {
  try {
    const gigs = await Gig.find({ ownerId: req.user.id })
      .populate("ownerId", "name email avatar")
      .sort({ createdAt: -1 })

    res.status(200).json({ success: true, gigs })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
