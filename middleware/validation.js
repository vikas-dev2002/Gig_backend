import { body, validationResult } from "express-validator"

export const validateRegister = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
]

export const validateGig = [
  body("title").notEmpty().withMessage("Title is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("budget").isNumeric().withMessage("Budget must be a number"),
]

export const validateBid = [
  body("message").notEmpty().withMessage("Message is required"),
  body("bidAmount").isNumeric().withMessage("Bid amount must be a number"),
]

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg })
  }
  next()
}
