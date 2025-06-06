import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import dotenv from "dotenv"
import cors from "cors"
import cookieParser from "cookie-parser"
import connectDB from "./config/db.js"
import errorHandler from "./middleware/errorHandler.js"
import browserService from "./services/browserService.js"

// Route imports
import authRoutes from "./routes/authRoutes.js"
import employeeRoutes from "./routes/employeeRoutes.js"
import platformRoutes from "./routes/platformRoutes.js"
import logRoutes from "./routes/logRoutes.js"

// Load environment variables
dotenv.config()

// Connect to MongoDB
connectDB()

const app = express()
const server = createServer(app)

// CORS configuration for production
const allowedOrigins = [
  "https://biz.bigdropsmarketing.com",
  "http://biz.bigdropsmarketing.com",
  "https://biz.bigdropsmarketing.com:5001",
  "http://biz.bigdropsmarketing.com:5001"
]

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
})

// Trust proxy (for getting real IP addresses)
app.set('trust proxy', true)

// CORS configuration with explicit methods and headers
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Body parser middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Make io available to routes
app.set('io', io)

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/employees", employeeRoutes)
app.use("/api/platforms", platformRoutes)
app.use("/api/logs", logRoutes)

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running!",
    timestamp: new Date().toISOString(),
    activeBrowserSessions: browserService.getActiveSessionsCount()
  })
})

// Socket.io connection handling
io.on('connection', (socket) => {
  // Join employee-specific room
  socket.on('join-employee-room', (employeeId) => {
    socket.join(`employee_${employeeId}`)
  })

  // Handle platform streaming request
  socket.on('start-platform-stream', async (data) => {
    try {
      const { employeeId, platformId, employee, platform } = data
      
      // Create browser session - don't let auto-login errors stop the stream
      try {
        await browserService.createSession(employeeId, platform, employee, io)
        
        socket.emit('stream-started', {
          success: true,
          message: 'Platform streaming started successfully'
        })
      } catch (sessionError) {
        // Try to create a basic session without auto-login
        try {
          await browserService.createBasicSession(employeeId, platform, employee, io)
          socket.emit('stream-started', {
            success: true,
            message: 'Platform streaming started (manual login required)'
          })
        } catch (basicError) {
          throw basicError
        }
      }

    } catch (error) {
      socket.emit('stream-error', {
        success: false,
        message: 'Failed to start platform streaming'
      })
    }
  })

  // Handle user interactions
  socket.on('user-interaction', async (data) => {
    try {
      const { employeeId, interaction } = data
      await browserService.handleUserInteraction(employeeId, interaction)
    } catch (error) {
      socket.emit('interaction-error', {
        message: 'Failed to process interaction'
      })
    }
  })

  // Handle stream stop
  socket.on('stop-platform-stream', async (data) => {
    try {
      const { employeeId } = data
      await browserService.closeSession(employeeId)
      
      socket.emit('stream-stopped', {
        success: true,
        message: 'Platform streaming stopped'
      })

    } catch (error) {
      socket.emit('stream-error', {
        success: false,
        message: 'Failed to stop platform streaming'
      })
    }
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    // Connection closed
  })
})

// Handle undefined routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  })
})

// Error handler middleware (should be last)
app.use(errorHandler)

// Graceful shutdown
process.on('SIGTERM', async () => {
  await browserService.closeAllSessions()
  server.close(() => {
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  await browserService.closeAllSessions()
  server.close(() => {
    process.exit(0)
  })
})

const PORT = process.env.PORT || 5001

server.listen(PORT, () => {
  // Server started on port ${PORT}
})