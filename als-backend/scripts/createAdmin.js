import dotenv from "dotenv"
import connectDB from "../config/db.js"
import Employee from "../models/Employee.js"

dotenv.config()

const createAdmin = async () => {
  try {
    await connectDB()
    
    // Check if admin already exists
    const existingAdmin = await Employee.findOne({ role: "admin" })
    
    if (existingAdmin) {
      console.log("ℹ️ Admin user already exists!")
      console.log("📧 Email:", existingAdmin.email)
      console.log("🆔 Employee ID:", existingAdmin.employeeId)
      process.exit(0)
    }
    
    // Create admin user
    const admin = new Employee({
      employeeId: "ADMIN001",
      name: {
        firstName: "System",
        lastName: "Administrator"
      },
      email: "admin@company.com",
      password: "admin123456", // Will be hashed automatically
      role: "admin"
    })
    
    await admin.save()
    
    console.log("✅ Admin user created successfully!")
    console.log("📧 Email: admin@company.com")
    console.log("🔑 Password: admin123456")
    console.log("🆔 Employee ID: ADMIN001")
    console.log("🔐 Role: admin")
    console.log("")
    console.log("⚠️ IMPORTANT: Please change the default password after first login!")
    
    process.exit(0)
  } catch (error) {
    console.error("❌ Error creating admin:", error)
    process.exit(1)
  }
}

createAdmin() 