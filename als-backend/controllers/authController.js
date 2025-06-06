import jwt from "jsonwebtoken"
import Employee from "../models/Employee.js"
import { createLog } from "./logController.js"

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  })
}

// @desc    Login employee
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password"
      })
    }

    // Check if employee exists
    const employee = await Employee.findOne({ email }).select("+password")

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    // Check if password matches
    const isPasswordCorrect = await employee.comparePassword(password)

    if (!isPasswordCorrect) {
      // Log failed login attempt for employees only
      if (employee.role === "employee") {
        try {
          await createLog(
            employee._id,
            "login",
            "Failed login attempt",
            null,
            {
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.get("User-Agent"),
              status: "failed"
            }
          )
        } catch (logError) {
          console.error("Error logging failed login:", logError)
        }
      }

      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    // Update login time
    employee.loginTime = new Date()
    employee.logoutTime = null
    await employee.save()

    // Create login log for employees only (not admins)
    if (employee.role === "employee") {
      try {
        await createLog(
          employee._id,
          "login",
          "Employee logged in successfully",
          null,
          {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get("User-Agent"),
            sessionId: `sess_${Math.random().toString(36).substr(2, 9)}`,
            status: "success"
          }
        )
      } catch (logError) {
        console.error("Error creating login log:", logError)
      }
    }

    // Generate token
    const token = generateToken(employee._id)

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        employee: {
          id: employee._id,
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          fullName: employee.fullName,
          loginTime: employee.loginTime
        }
      }
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

// @desc    Logout employee
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee.id)
    
    if (employee) {
      const loginTime = employee.loginTime
      employee.logoutTime = new Date()
      await employee.save()

      // Create logout log for employees only (not admins)
      if (employee.role === "employee") {
        try {
          // Calculate session duration
          const duration = loginTime ? Math.round((employee.logoutTime - loginTime) / (1000 * 60)) : null

          await createLog(
            employee._id,
            "logout",
            "Employee logged out successfully",
            null,
            {
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.get("User-Agent"),
              duration: duration,
              status: "success"
            }
          )
        } catch (logError) {
          console.error("Error creating logout log:", logError)
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Logout successful"
    })
  } catch (error) {
    console.error("Logout error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

// @desc    Get current employee profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee.id)

    res.status(200).json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          fullName: employee.fullName,
          loginTime: employee.loginTime,
          logoutTime: employee.logoutTime,
          createdAt: employee.createdAt
        }
      }
    })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
} 