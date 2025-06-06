import Log from "../models/Log.js"
import Employee from "../models/Employee.js"
import Platform from "../models/Platform.js"

// Helper function to create a log entry
export const createLog = async (employeeId, action, description, platformId = null, metadata = {}) => {
  try {
    const logData = {
      employee: employeeId,
      action,
      description,
      metadata
    }

    if (platformId) {
      logData.platform = platformId
    }

    const log = new Log(logData)
    await log.save()
    return log
  } catch (error) {
    console.error("Error creating log:", error)
    throw error
  }
}

// @desc    Get all logs (Admin only)
// @route   GET /api/logs
// @access  Private/Admin
export const getAllLogs = async (req, res) => {
  try {
    const { 
      employee: employeeFilter, 
      action: actionFilter, 
      startDate, 
      endDate,
      limit = 100,
      page = 1
    } = req.query

    // Build query
    let query = {}

    // Filter by employee (only non-admin employees)
    if (employeeFilter) {
      query.employee = employeeFilter
    } else {
      // Only get logs from employees (not admins)
      const employees = await Employee.find({ role: "employee" }).select("_id")
      query.employee = { $in: employees.map(emp => emp._id) }
    }

    // Filter by action
    if (actionFilter && actionFilter !== "all") {
      query.action = actionFilter
    }

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {}
      if (startDate) {
        query.timestamp.$gte = new Date(startDate)
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate)
      }
    }

    // Calculate skip for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Execute query with population
    const logs = await Log.find(query)
      .populate("employee", "employeeId name email")
      .populate("platform", "platformId platformName clientName")
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip)

    // Get total count for pagination
    const totalLogs = await Log.countDocuments(query)

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalLogs / parseInt(limit)),
          totalLogs,
          limit: parseInt(limit)
        }
      }
    })
  } catch (error) {
    console.error("Get logs error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

// @desc    Get logs for a specific employee (Admin only)
// @route   GET /api/logs/employee/:employeeId
// @access  Private/Admin
export const getEmployeeLogs = async (req, res) => {
  try {
    const { employeeId } = req.params
    const { action: actionFilter, startDate, endDate, limit = 50 } = req.query

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
        message: "Cannot retrieve logs for admin users"
      })
    }

    // Build query
    let query = { employee: employeeId }

    // Filter by action
    if (actionFilter && actionFilter !== "all") {
      query.action = actionFilter
    }

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {}
      if (startDate) {
        query.timestamp.$gte = new Date(startDate)
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate)
      }
    }

    // Execute query
    const logs = await Log.find(query)
      .populate("employee", "employeeId name email")
      .populate("platform", "platformId platformName clientName")
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))

    res.status(200).json({
      success: true,
      data: {
        logs,
        employee: {
          id: employee._id,
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email
        }
      }
    })
  } catch (error) {
    console.error("Get employee logs error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
} 