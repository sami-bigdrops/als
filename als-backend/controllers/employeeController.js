import Employee from "../models/Employee.js"

// @desc    Create new employee (Admin only)
// @route   POST /api/employees
// @access  Private/Admin
export const createEmployee = async (req, res) => {
  try {
    const { employeeId, firstName, lastName, email, password, role = "employee" } = req.body

    // Validation
    if (!employeeId || !firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields: employeeId, firstName, lastName, email, password"
      })
    }

    // Check if employee ID already exists
    const existingEmployeeId = await Employee.findOne({ employeeId })
    if (existingEmployeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID already exists"
      })
    }

    // Check if email already exists
    const existingEmail = await Employee.findOne({ email })
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      })
    }

    // Create new employee
    const employee = new Employee({
      employeeId,
      name: {
        firstName,
        lastName
      },
      email,
      password,
      role
    })

    await employee.save()

    // Return employee data without password
    const employeeData = {
      id: employee._id,
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      fullName: employee.fullName,
      createdAt: employee.createdAt
    }

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: {
        employee: employeeData
      }
    })
  } catch (error) {
    console.error("Create employee error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

// @desc    Get all employees (Admin only)
// @route   GET /api/employees
// @access  Private/Admin
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({}).select("-password").sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      data: {
        employees,
        count: employees.length
      }
    })
  } catch (error) {
    console.error("Get employees error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

// @desc    Get employee by ID (Admin only)
// @route   GET /api/employees/:id
// @access  Private/Admin
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select("-password")

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      })
    }

    res.status(200).json({
      success: true,
      data: {
        employee
      }
    })
  } catch (error) {
    console.error("Get employee error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

// @desc    Update employee (Admin only)
// @route   PUT /api/employees/:id
// @access  Private/Admin
export const updateEmployee = async (req, res) => {
  try {
    const { employeeId, firstName, lastName, email, role } = req.body

    const employee = await Employee.findById(req.params.id)

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      })
    }

    // Check if new employeeId conflicts with another employee
    if (employeeId && employeeId !== employee.employeeId) {
      const existingEmployeeId = await Employee.findOne({ 
        employeeId, 
        _id: { $ne: req.params.id } 
      })
      if (existingEmployeeId) {
        return res.status(400).json({
          success: false,
          message: "Employee ID already exists"
        })
      }
    }

    // Check if new email conflicts with another employee
    if (email && email !== employee.email) {
      const existingEmail = await Employee.findOne({ 
        email, 
        _id: { $ne: req.params.id } 
      })
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already exists"
        })
      }
    }

    // Update fields
    if (employeeId) employee.employeeId = employeeId
    if (firstName) employee.name.firstName = firstName
    if (lastName) employee.name.lastName = lastName
    if (email) employee.email = email
    if (role) employee.role = role

    await employee.save()

    const employeeData = {
      id: employee._id,
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      fullName: employee.fullName,
      loginTime: employee.loginTime,
      logoutTime: employee.logoutTime,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt
    }

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: {
        employee: employeeData
      }
    })
  } catch (error) {
    console.error("Update employee error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

// @desc    Delete employee (Admin only)
// @route   DELETE /api/employees/:id
// @access  Private/Admin
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      })
    }

    await Employee.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully"
    })
  } catch (error) {
    console.error("Delete employee error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
} 