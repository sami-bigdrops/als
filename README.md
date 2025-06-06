# Automated Login System (ALS)

A comprehensive full-stack employee management and platform automation system with real-time browser streaming capabilities, built with React (Frontend) and Node.js/Express (Backend) with MongoDB.

## 🚀 Key Features

### 🔐 **Authentication & Security**
- **JWT-based Authentication** with bcrypt password hashing
- **Role-based Access Control** (Admin/Employee)
- **Secure Session Management** with automatic logout
- **CORS Protection** with environment-based configuration

### 👥 **Employee Management**
- **Complete Employee CRUD** operations
- **Platform Assignment** system
- **Activity Logging** and audit trails
- **Login/Logout Tracking** with timestamps

### 🖥️ **Platform Automation**
- **Real-time Browser Streaming** with Puppeteer
- **Automated Login** to assigned platforms
- **Interactive Browser Control** (click, type, scroll)
- **Live Screenshot Streaming** via Socket.io
- **Platform Credentials Management**

### 📊 **Admin Dashboard**
- **Employee Management** interface
- **Platform Management** system
- **Assignment Management** (employees ↔ platforms)
- **Activity Logs** and monitoring
- **Real-time Statistics**

### 🎨 **Modern UI/UX**
- **Beautiful Dashboard** with Shadcn/UI components
- **Responsive Design** with Tailwind CSS
- **Real-time Toast Notifications** with Sonner
- **Interactive Platform Cards**
- **Live Browser Streaming** interface

## 📁 Project Structure

```
Automated Login System/
├── als-backend/                 # Node.js/Express backend
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   ├── employeeController.js # Employee management
│   │   ├── platformController.js # Platform management
│   │   └── logController.js    # Activity logging
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication
│   │   └── errorHandler.js     # Global error handling
│   ├── models/
│   │   ├── Employee.js         # Employee schema
│   │   ├── Platform.js         # Platform schema
│   │   └── Log.js              # Activity log schema
│   ├── routes/
│   │   ├── authRoutes.js       # Auth endpoints
│   │   ├── employeeRoutes.js   # Employee endpoints
│   │   ├── platformRoutes.js   # Platform endpoints
│   │   └── logRoutes.js        # Log endpoints
│   ├── services/
│   │   └── browserService.js   # Puppeteer automation
│   ├── scripts/
│   │   └── createAdmin.js      # Admin user creation
│   └── server.js               # Main server with Socket.io
├── als-frontend/               # React frontend
│   ├── src/
│   │   ├── login/              # Login components & hooks
│   │   ├── dashboard/          # Employee & Admin dashboards
│   │   ├── components/         # Shared UI components
│   │   │   ├── ui/             # Shadcn/UI components
│   │   │   ├── Navbar.jsx      # Navigation component
│   │   │   └── PlatformStreaming.jsx # Live streaming component
│   │   ├── config/
│   │   │   └── api.js          # Smart API configuration
│   │   └── lib/
│   │       └── utils.js        # Utility functions
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB Atlas** account or local MongoDB
- **Git**

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd als-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create `.env` file with:
   ```env
   # Server Configuration
   PORT=5001
   NODE_ENV=development

   # Database Configuration
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/auto_login?retryWrites=true&w=majority

   # JWT Configuration
   JWT_SECRET=your-super-secure-jwt-secret-key-here
   JWT_EXPIRES_IN=14h

   # Frontend Configuration
   FRONTEND_URL=http://localhost:5173
   ```

4. **Create Admin User**
   ```bash
   npm run create-admin
   ```
   This creates an admin user with:
   - **Email**: `admin@company.com`
   - **Password**: `admin123456`
   - **Employee ID**: `ADMIN001`

5. **Start the backend server**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:5001`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd als-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration** (Optional)
   Create `.env` file for custom API URLs:
   ```env
   VITE_API_URL=http://localhost:5001/api
   VITE_API_BASE_URL=http://localhost:5001
   VITE_SOCKET_URL=http://localhost:5001
   ```

4. **Start the frontend development server**
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

## 🧪 Testing the Application

### Admin Login
- **URL**: `http://localhost:5173`
- **Email**: `admin@company.com`
- **Password**: `admin123456`
- **Access**: Admin Dashboard with full system control

### Testing Flow

1. **Admin Login** → Access admin dashboard
2. **Create Employees** → Add new employee accounts
3. **Create Platforms** → Add platforms for automation
4. **Assign Platforms** → Link employees to specific platforms
5. **Employee Login** → Test employee access
6. **Platform Streaming** → Test real-time browser automation

## 🔌 API Endpoints

### Authentication Routes
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/login` | User login | Public |
| POST | `/api/auth/logout` | User logout | Private |
| GET | `/api/auth/profile` | Get user profile | Private |

### Employee Management (Admin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/employees` | Create employee |
| GET | `/api/employees` | Get all employees |
| GET | `/api/employees/:id` | Get employee by ID |
| PUT | `/api/employees/:id` | Update employee |
| DELETE | `/api/employees/:id` | Delete employee |

### Platform Management (Admin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/platforms` | Create platform |
| GET | `/api/platforms` | Get all platforms |
| GET | `/api/platforms/:id` | Get platform by ID |
| PUT | `/api/platforms/:id` | Update platform |
| DELETE | `/api/platforms/:id` | Delete platform |
| POST | `/api/platforms/:id/assign` | Assign platform to employee |
| POST | `/api/platforms/:id/unassign` | Unassign platform from employee |

### Platform Access (Employee)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/platforms/employee/:id` | Get assigned platforms |
| GET | `/api/platforms/:id/streaming` | Get platform for streaming |
| POST | `/api/platforms/:id/access` | Log platform access |

### Activity Logs (Admin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/logs` | Get all activity logs |
| GET | `/api/logs/employee/:id` | Get employee logs |

### Health Check
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/health` | Server health status | Public |

## 🗄️ Database Schemas

### Employee Model
```javascript
{
  employeeId: String (unique, required),
  name: {
    firstName: String (required),
    lastName: String (required)
  },
  email: String (unique, required),
  password: String (hashed, required),
  role: String (enum: ['admin', 'employee']),
  assignedPlatforms: [ObjectId] (ref: 'Platform'),
  loginTime: Date,
  logoutTime: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Platform Model
```javascript
{
  platformId: String (unique, required),
  platformName: String (required),
  clientName: String (required),
  url: String (required),
  email: String (required),
  password: String (required),
  isActive: Boolean (default: true),
  assignedEmployees: [ObjectId] (ref: 'Employee'),
  createdBy: ObjectId (ref: 'Employee'),
  createdAt: Date,
  updatedAt: Date
}
```

### Log Model
```javascript
{
  employee: ObjectId (ref: 'Employee'),
  action: String (enum: ['login', 'logout', 'platform_access']),
  description: String,
  platform: ObjectId (ref: 'Platform', optional),
  metadata: {
    ipAddress: String,
    userAgent: String,
    sessionId: String,
    duration: Number,
    status: String
  },
  timestamp: Date
}
```

## ⚡ Real-time Features

### Socket.io Events

**Client → Server:**
- `join-employee-room` - Join employee-specific room
- `start-platform-stream` - Start browser automation
- `stop-platform-stream` - Stop browser session
- `user-interaction` - Send user interactions (click, type, scroll)

**Server → Client:**
- `screenshot` - Live browser screenshots
- `login-status` - Automation status updates
- `stream-started` - Stream initialization complete
- `stream-stopped` - Stream ended
- `stream-error` - Stream error occurred
- `page-error` - Browser page error
- `page-dialog` - Browser dialog detected

### Browser Automation Features

- **Automated Login**: Intelligent form detection and filling
- **Live Streaming**: Real-time browser screenshots (1 FPS)
- **Interactive Control**: Click, type, scroll, and navigate
- **Multi-strategy Login**: Multiple approaches for different platforms
- **Session Management**: Secure browser session handling
- **Error Recovery**: Graceful error handling and recovery

## 🔐 Security Features

- **Environment-based CORS**: Smart origin detection
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: Bcrypt with salt rounds of 12
- **Role-based Access**: Admin/Employee permissions
- **Input Validation**: Server-side validation
- **Session Security**: Browser session isolation
- **Credential Protection**: Encrypted platform passwords
- **Activity Logging**: Comprehensive audit trails

## 🎨 Frontend Architecture

### Smart API Configuration
- **Environment Detection**: Auto-detects localhost vs production
- **Dynamic URLs**: Adapts to deployment environment
- **Port Handling**: Automatic port configuration

### Component Structure
- **Modular Design**: Feature-based organization
- **Custom Hooks**: Reusable logic patterns
- **UI Components**: Shadcn/UI component library
- **State Management**: React hooks with localStorage
- **Toast System**: Color-coded user feedback
- **Responsive Design**: Mobile-first approach

## 🚀 Production Deployment

### Environment Variables

**Development:**
```env
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Production:**
```env
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
```

### Build Commands

**Frontend:**
```bash
npm run build     # Build for production
npm run preview   # Preview production build
```

**Backend:**
```bash
npm start         # Production server
```

## 📈 Monitoring & Logs

### Activity Tracking
- **Login/Logout Events**: Automatic session tracking
- **Platform Access**: Detailed platform usage logs
- **User Interactions**: Browser automation activities
- **Error Logging**: Comprehensive error tracking
- **Performance Metrics**: Response times and usage stats

### Log Filtering
- **By Employee**: Individual employee activity
- **By Action Type**: Login, logout, platform access
- **By Date Range**: Time-based filtering
- **By Status**: Success/failed operations

## 🛠️ Development

### Available Scripts

**Backend:**
```bash
npm run dev          # Development server with nodemon
npm start            # Production server
npm run create-admin # Create admin user
```

**Frontend:**
```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview build
npm run lint         # ESLint check
```

### Adding New Features

1. **New API Endpoints**: Add to appropriate controller and route
2. **Database Models**: Define in models directory
3. **Frontend Components**: Create in components directory
4. **Socket Events**: Add to browserService.js
5. **UI Components**: Extend Shadcn/UI components

## 🐛 Troubleshooting

### Common Issues

**Backend Connection:**
- Verify MongoDB connection string
- Check port 5001 availability
- Ensure environment variables are set

**Frontend API Calls:**
- Check backend server is running
- Verify CORS configuration
- Check browser console for errors

**Platform Streaming:**
- Ensure Socket.io connection
- Check browser permissions
- Verify platform credentials

**Authentication Issues:**
- Clear localStorage and cookies
- Check JWT token expiration
- Verify user credentials

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## 📝 License

This project is proprietary software developed by BDMG Team.

---

**Built with ❤️ by BDMG Team**

*Automated Login System v2.0 - Advanced Platform Automation & Employee Management* 