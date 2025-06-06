import express from "express"
import { 
  createEmployee, 
  getAllEmployees, 
  getEmployeeById, 
  updateEmployee, 
  deleteEmployee 
} from "../controllers/employeeController.js"
import { protect, adminOnly } from "../middleware/auth.js"

const router = express.Router()

// All routes require authentication and admin privileges
router.use(protect, adminOnly)

// Employee CRUD routes
router.post("/", createEmployee)
router.get("/", getAllEmployees)
router.get("/:id", getEmployeeById)
router.put("/:id", updateEmployee)
router.delete("/:id", deleteEmployee)

export default router 