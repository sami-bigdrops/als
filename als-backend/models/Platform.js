import mongoose from "mongoose"

const platformSchema = new mongoose.Schema({
  platformId: {
    type: String,
    required: [true, "Platform ID is required"],
    unique: true,
    trim: true
  },
  platformName: {
    type: String,
    required: [true, "Platform name is required"],
    trim: true
  },
  clientName: {
    type: String,
    required: [true, "Client name is required"],
    trim: true
  },
  url: {
    type: String,
    required: [true, "Platform URL is required"],
    trim: true,
    match: [/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/, "Please provide a valid URL"]
  },
  email: {
    type: String,
    required: [true, "Platform email is required"],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"]
  },
  password: {
    type: String,
    required: [true, "Platform password is required"],
    minlength: [6, "Password must be at least 6 characters"]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  assignedEmployees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  }
}, {
  timestamps: true
})

// Simple method to get password for streaming (now just returns the plain password)
platformSchema.methods.getStreamingPassword = function() {
  return this.password
}

// Ensure virtual fields are serialized
platformSchema.set('toJSON', { virtuals: true })

const Platform = mongoose.model("Platform", platformSchema)

export default Platform 