import jwt from "jsonwebtoken"
import Employee from "../models/Employee.js"

export const protect = async (req, res, next) => {
  try {
    let token
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route"
      })
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Get employee from token
    const employee = await Employee.findById(decoded.id).select("-password")
    
    if (!employee) {
      return res.status(401).json({
        success: false,
        message: "No employee found with this token"
      })
    }
    
    req.employee = employee
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route"
    })
  }
}

// Admin authorization middleware
export const adminOnly = (req, res, next) => {
  if (req.employee && req.employee.role === 'admin') {
    next()
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required."
    })
  }
} 