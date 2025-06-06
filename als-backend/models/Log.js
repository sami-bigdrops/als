import mongoose from "mongoose"

const logSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ["login", "logout", "platform_access"]
  },
  description: {
    type: String,
    required: true
  },
  platform: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Platform",
    required: false
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    sessionId: String,
    duration: Number, // in minutes
    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success"
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Index for performance
logSchema.index({ employee: 1, timestamp: -1 })
logSchema.index({ action: 1, timestamp: -1 })
logSchema.index({ timestamp: -1 })

const Log = mongoose.model("Log", logSchema)

export default Log 