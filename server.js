import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import dotenv from "dotenv"
import { createServer } from "http"
import { Server } from "socket.io"
import connectDB from "./config/database.js"
import authRoutes from "./routes/auth.js"
import gigsRoutes from "./routes/gigs.js"
import bidsRoutes from "./routes/bids.js"
import Bid from "./models/Bid.js"
import Gig from "./models/Gig.js"

dotenv.config()
connectDB()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
})

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
)

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/gigs", gigsRoutes)
app.use("/api/bids", bidsRoutes)

// Socket.io for real-time notifications
io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  socket.on("join_user", (userId) => {
    socket.join(`user_${userId}`)
    console.log(`User ${userId} joined their notification room`)
  })

  socket.on("hire_freelancer", async (data) => {
    try {
      const bid = await Bid.findOne({ _id: data.bidId }).populate("freelancerId")
      const gig = await Gig.findById(data.gigId)

      // Send notification to hired freelancer
      io.to(`user_${data.freelancerId}`).emit("hired_notification", {
        gigTitle: gig.title,
        gigId: data.gigId,
        budget: gig.budget,
        message: `Congratulations! You have been hired for "${gig.title}"!`,
      })

      console.log(`Freelancer ${data.freelancerId} notified about hiring`)
    } catch (error) {
      console.error("Error sending hire notification:", error)
    }
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
  })
})

// Export io for use in routes
app.locals.io = io

const PORT = process.env.PORT || 3000
httpServer.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`)
})
