import Platform from "../models/Platform.js"
import Employee from "../models/Employee.js"
import { createLog } from "./logController.js"

// @desc    Create new platform (Admin only)
// @route   POST /api/platforms
// @access  Private/Admin
export const createPlatform = async (req, res) => {
  try {
    const { platformId, platformName, clientName, url, email, password } = req.body

    // Validation
    if (!platformId || !platformName || !clientName || !url || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields: platformId, platformName, clientName, url, email, password"
      })
    }

    // Check if platform ID already exists
    const existingPlatformId = await Platform.findOne({ platformId })
    if (existingPlatformId) {
      return res.status(400).json({
        success: false,
        message: "Platform ID already exists"
      })
    }

    // Check if platform name already exists
    const existingPlatformName = await Platform.findOne({ platformName })
    if (existingPlatformName) {
      return res.status(400).json({
        success: false,
        message: "Platform name already exists"
      })
    }

    // Create new platform
    const platform = new Platform({
      platformId,
      platformName,
      clientName,
      url,
      email,
      password,
      createdBy: req.employee.id
    })

    await platform.save()

    // Return platform data without password
    const platformData = {
      id: platform._id,
      platformId: platform.platformId,
      platformName: platform.platformName,
      clientName: platform.clientName,
      url: platform.url,
      email: platform.email,
      isActive: platform.isActive,
      assignedEmployees: platform.assignedEmployees,
      createdBy: platform.createdBy,
      createdAt: platform.createdAt
    }

    res.status(201).json({
      success: true,
      message: "Platform created successfully",
      data: {
        platform: platformData
      }
    })
  } catch (error) {
    console.error("Create platform error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

// @desc    Get all platforms (Admin only)
// @route   GET /api/platforms
// @access  Private/Admin
export const getAllPlatforms = async (req, res) => {
  try {
    const platforms = await Platform.find({})
      .select("-password")
      .populate('assignedEmployees', 'employeeId name email')
      .populate('createdBy', 'employeeId name email')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      data: {
        platforms,
        count: platforms.length
      }
    })
  } catch (error) {
    console.error("Get platforms error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

// @desc    Get platform by ID (Admin only)
// @route   GET /api/platforms/:id
// @access  Private/Admin
export const getPlatformById = async (req, res) => {
  try {
    const platform = await Platform.findById(req.params.id)
      .select("-password")
      .populate('assignedEmployees', 'employeeId name email')
      .populate('createdBy', 'employeeId name email')

    if (!platform) {
      return res.status(404).json({
        success: false,
        message: "Platform not found"
      })
    }

    res.status(200).json({
      success: true,
      data: {
        platform
      }
    })
  } catch (error) {
    console.error("Get platform error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

// @desc    Update platform (Admin only)
// @route   PUT /api/platforms/:id
// @access  Private/Admin
export const updatePlatform = async (req, res) => {
  try {
    const { platformId, platformName, clientName, url, email, password, isActive } = req.body

    const platform = await Platform.findById(req.params.id)

    if (!platform) {
      return res.status(404).json({
        success: false,
        message: "Platform not found"
      })
    }

    // Check if new platformId conflicts with another platform
    if (platformId && platformId !== platform.platformId) {
      const existingPlatformId = await Platform.findOne({ 
        platformId, 
        _id: { $ne: req.params.id } 
      })
      if (existingPlatformId) {
        return res.status(400).json({
          success: false,
          message: "Platform ID already exists"
        })
      }
    }

    // Check if new platformName conflicts with another platform
    if (platformName && platformName !== platform.platformName) {
      const existingPlatformName = await Platform.findOne({ 
        platformName, 
        _id: { $ne: req.params.id } 
      })
      if (existingPlatformName) {
        return res.status(400).json({
          success: false,
          message: "Platform name already exists"
        })
      }
    }

    // Update fields
    if (platformId) platform.platformId = platformId
    if (platformName) platform.platformName = platformName
    if (clientName) platform.clientName = clientName
    if (url) platform.url = url
    if (email) platform.email = email
    if (password) platform.password = password
    if (typeof isActive !== 'undefined') platform.isActive = isActive

    await platform.save()

    const platformData = {
      id: platform._id,
      platformId: platform.platformId,
      platformName: platform.platformName,
      clientName: platform.clientName,
      url: platform.url,
      email: platform.email,
      isActive: platform.isActive,
      assignedEmployees: platform.assignedEmployees,
      createdBy: platform.createdBy,
      createdAt: platform.createdAt,
      updatedAt: platform.updatedAt
    }

    res.status(200).json({
      success: true,
      message: "Platform updated successfully",
      data: {
        platform: platformData
      }
    })
  } catch (error) {
    console.error("Update platform error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

// @desc    Delete platform (Admin only)
// @route   DELETE /api/platforms/:id
// @access  Private/Admin
export const deletePlatform = async (req, res) => {
  try {
    const platform = await Platform.findById(req.params.id)

    if (!platform) {
      return res.status(404).json({
        success: false,
        message: "Platform not found"
      })
    }

    // Remove platform from all assigned employees
    await Employee.updateMany(
      { assignedPlatforms: platform._id },
      { $pull: { assignedPlatforms: platform._id } }
    )

    await Platform.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: "Platform deleted successfully"
    })
  } catch (error) {
    console.error("Delete platform error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

// @desc    Assign platform to employee (Admin only)
// @route   POST /api/platforms/:platformId/assign
// @access  Private/Admin
export const assignPlatformToEmployee = async (req, res) => {
  try {
    const { platformId } = req.params
    const { employeeId } = req.body

    const platform = await Platform.findById(platformId)
    const employee = await Employee.findById(employeeId)

    if (!platform) {
      return res.status(404).json({
        success: false,
        message: "Platform not found"
      })
    }

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      })
    }

    // Check if already assigned
    if (platform.assignedEmployees.includes(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Platform already assigned to this employee"
      })
    }

    // Add to both models
    platform.assignedEmployees.push(employeeId)
    employee.assignedPlatforms.push(platformId)

    await platform.save()
    await employee.save()

    res.status(200).json({
      success: true,
      message: "Platform assigned to employee successfully"
    })
  } catch (error) {
    console.error("Assign platform error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

// @desc    Unassign platform from employee (Admin only)
// @route   POST /api/platforms/:platformId/unassign
// @access  Private/Admin
export const unassignPlatformFromEmployee = async (req, res) => {
  try {
    const { platformId } = req.params
    const { employeeId } = req.body

    const platform = await Platform.findById(platformId)
    const employee = await Employee.findById(employeeId)

    if (!platform) {
      return res.status(404).json({
        success: false,
        message: "Platform not found"
      })
    }

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      })
    }

    // Remove from both models
    platform.assignedEmployees.pull(employeeId)
    employee.assignedPlatforms.pull(platformId)

    await platform.save()
    await employee.save()

    res.status(200).json({
      success: true,
      message: "Platform unassigned from employee successfully"
    })
  } catch (error) {
    console.error("Unassign platform error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

// @desc    Get employee's assigned platforms
// @route   GET /api/platforms/employee/:employeeId
// @access  Private/Admin or Self
export const getEmployeePlatforms = async (req, res) => {
  try {
    const { employeeId } = req.params
    const { includeCredentials } = req.query // New query parameter for streaming

    // Check if admin or self
    if (req.employee.role !== 'admin' && req.employee.id !== employeeId) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      })
    }

    // Only include password for streaming if specifically requested and user is the employee themselves
    const selectFields = includeCredentials === 'true' && req.employee.id === employeeId ? '' : '-password'

    const employee = await Employee.findById(employeeId)
      .populate('assignedPlatforms', selectFields)

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      })
    }

    const responseData = {
      success: true,
      data: {
        employee: {
          id: employee._id,
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email
        },
        platforms: employee.assignedPlatforms,
        count: employee.assignedPlatforms.length
      }
    }

    res.status(200).json(responseData)
  } catch (error) {
    console.error("Get employee platforms error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

// @desc    Get platform with credentials for streaming (Employee only)
// @route   GET /api/platforms/:platformId/streaming
// @access  Private/Employee (Self only)
export const getPlatformForStreaming = async (req, res) => {
  try {
    const { platformId } = req.params
    const employeeId = req.employee.id

    // Only employees can stream platforms (not admins for security)
    if (req.employee.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: "Admins cannot stream platforms"
      })
    }

    // Check if employee exists
    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      })
    }

    // Check if platform exists and is active
    const platform = await Platform.findById(platformId)
    if (!platform) {
      return res.status(404).json({
        success: false,
        message: "Platform not found"
      })
    }

    if (!platform.isActive) {
      return res.status(400).json({
        success: false,
        message: "Platform is not active"
      })
    }

    // Check if platform is assigned to employee
    if (!platform.assignedEmployees.includes(employeeId)) {
      return res.status(403).json({
        success: false,
        message: "Platform not assigned to this employee"
      })
    }

    // Return platform with credentials for streaming
    res.status(200).json({
      success: true,
      data: {
        platform: {
          _id: platform._id,
          platformId: platform.platformId,
          platformName: platform.platformName,
          clientName: platform.clientName,
          url: platform.url,
          email: platform.email,
          password: platform.getStreamingPassword(), // Use decrypted password for streaming
          isActive: platform.isActive,
          createdAt: platform.createdAt,
          updatedAt: platform.updatedAt
        }
      }
    })
  } catch (error) {
    console.error("Get platform for streaming error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

// @desc    Log platform access (Employee only)
// @route   POST /api/platforms/:platformId/access
// @access  Private/Employee
export const logPlatformAccess = async (req, res) => {
  try {
    const { platformId } = req.params
    const employeeId = req.employee.id

    // Check if employee exists and is not admin
    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      })
    }

    if (employee.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Admins cannot log platform access"
      })
    }

    // Check if platform exists
    const platform = await Platform.findById(platformId)
    if (!platform) {
      return res.status(404).json({
        success: false,
        message: "Platform not found"
      })
    }

    // Check if platform is assigned to employee
    if (!platform.assignedEmployees.includes(employeeId)) {
      return res.status(403).json({
        success: false,
        message: "Platform not assigned to this employee"
      })
    }

    // Create platform access log
    await createLog(
      employeeId,
      "platform_access",
      `Accessed platform "${platform.platformName}"`,
      platformId,
      {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        sessionId: req.body.sessionId || `sess_${Math.random().toString(36).substr(2, 9)}`,
        status: "success"
      }
    )

    res.status(200).json({
      success: true,
      message: "Platform access logged successfully"
    })
  } catch (error) {
    console.error("Log platform access error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

export default { 
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
} 