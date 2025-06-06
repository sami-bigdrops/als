import mongoose from "mongoose"
import bcryptjs from "bcryptjs"

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: [true, "Employee ID is required"],
    unique: true,
    trim: true
  },
  name: {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true
    }
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"]
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"]
  },
  role: {
    type: String,
    enum: ["admin", "employee"],
    default: "employee",
    required: true
  },
  assignedPlatforms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Platform'
  }],
  loginTime: {
    type: Date,
    default: null
  },
  logoutTime: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
})

// Hash password before saving
employeeSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next()
  
  this.password = await bcryptjs.hash(this.password, 12)
  next()
})

// Compare password method
employeeSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcryptjs.compare(candidatePassword, this.password)
}

// Get full name virtual
employeeSchema.virtual("fullName").get(function() {
  return `${this.name.firstName} ${this.name.lastName}`
})

// Ensure virtual fields are serialized
employeeSchema.set('toJSON', { virtuals: true })

const Employee = mongoose.model("Employee", employeeSchema)

export default Employee 