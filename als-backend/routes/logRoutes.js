import express from "express"
import { getAllLogs, getEmployeeLogs } from "../controllers/logController.js"
import { protect, adminOnly } from "../middleware/auth.js"

const router = express.Router()

// All routes require authentication and admin privileges
router.use(protect, adminOnly)

// Log routes (Admin only)
router.get("/", getAllLogs)
router.get("/employee/:employeeId", getEmployeeLogs)

export default router 