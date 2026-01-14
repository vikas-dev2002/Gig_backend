import mongoose from "mongoose"

const gigSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a title"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please provide a description"],
    },
    budget: {
      type: Number,
      required: [true, "Please provide a budget"],
      min: 0,
    },
    category: {
      type: String,
      enum: ["web-development", "mobile-app", "design", "writing", "marketing", "data-science", "other"],
      default: "web-development",
    },
    skills: {
      type: [String],
      default: [],
    },
    deadline: {
      type: Date,
      required: false,
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "expert"],
      default: "intermediate",
    },
    attachments: {
      type: [String],
      default: [],
    },
    estimatedTime: {
      type: String,
      enum: ["less-than-week", "1-2-weeks", "1-month", "2-3-months", "3-plus-months"],
      default: "1-2-weeks",
    },
    minBidAmount: {
      type: Number,
      default: 0,
    },
    maxBidAmount: {
      type: Number,
      required: false,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ownerName: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["open", "assigned"],
      default: "open",
    },
    hiredBidId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bid",
      default: null,
    },
  },
  { timestamps: true },
)

// Index for search functionality
gigSchema.index({ title: "text", description: "text", skills: "text" })
gigSchema.index({ status: 1 })
gigSchema.index({ category: 1 })
gigSchema.index({ level: 1 })

export default mongoose.model("Gig", gigSchema)
