import mongoose from "mongoose"

const bidSchema = new mongoose.Schema(
  {
    gigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gig",
      required: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: [true, "Please provide a bid message"],
    },
    bidAmount: {
      type: Number,
      required: [true, "Please provide a bid amount"],
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "hired", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
)

// Ensure one bid per freelancer per gig
bidSchema.index({ gigId: 1, freelancerId: 1 }, { unique: true })

export default mongoose.model("Bid", bidSchema)
