const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  console.error(err)

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found'
    error = { message, statusCode: 404 }
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let message = 'Duplicate field value entered'
    
    // Extract field name from error
    const field = Object.keys(err.keyValue)[0]
    if (field === 'email') {
      message = 'Email already exists'
    } else if (field === 'employeeId') {
      message = 'Employee ID already exists'
    }
    
    error = { message, statusCode: 400 }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ')
    error = { message, statusCode: 400 }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error'
  })
}

export default errorHandler 