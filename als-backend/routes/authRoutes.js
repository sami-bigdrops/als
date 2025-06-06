import express from "express"
import { login, logout, getProfile } from "../controllers/authController.js"
import { protect } from "../middleware/auth.js"

const router = express.Router()

// Public routes
router.post("/login", login)

// Protected routes
router.post("/logout", protect, logout)
router.get("/profile", protect, getProfile)

export default router 