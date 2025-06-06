import express from "express"
import { 
  createPlatform, 
  getAllPlatforms, 
  getPlatformById, 
  updatePlatform, 
  deletePlatform,
  assignPlatformToEmployee,
  unassignPlatformFromEmployee,
  getEmployeePlatforms,
  logPlatformAccess,
  getPlatformForStreaming
} from "../controllers/platformController.js"
import { protect, adminOnly } from "../middleware/auth.js"

const router = express.Router()

// Protect all routes
router.use(protect)

// Platform CRUD routes (Admin only)
router.post("/", adminOnly, createPlatform)
router.get("/", adminOnly, getAllPlatforms)
router.get("/:id", adminOnly, getPlatformById)
router.put("/:id", adminOnly, updatePlatform)
router.delete("/:id", adminOnly, deletePlatform)

// Platform assignment routes (Admin only)
router.post("/:platformId/assign", adminOnly, assignPlatformToEmployee)
router.post("/:platformId/unassign", adminOnly, unassignPlatformFromEmployee)

// Get employee platforms (Admin or Self)
router.get("/employee/:employeeId", getEmployeePlatforms)

// Platform streaming with credentials (Employee only)
router.get("/:platformId/streaming", getPlatformForStreaming)

// Platform access logging (Employee only)
router.post("/:platformId/access", logPlatformAccess)

export default router 