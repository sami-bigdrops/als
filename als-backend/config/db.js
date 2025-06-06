import mongoose from "mongoose"

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    // Database connected successfully
  } catch (error) {
    console.error("Database connection error:", error)
    process.exit(1)
  }
}

export default connectDB