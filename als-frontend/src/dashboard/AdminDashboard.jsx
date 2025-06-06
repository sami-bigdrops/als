import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Navbar from '../components/Navbar'
import { API_URL } from '../config/api'

function AdminDashboard() {
  const [employee, setEmployee] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  // Stats data
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    totalPlatforms: 0
  })

  // Data states
  const [employees, setEmployees] = useState([])
  const [platforms, setPlatforms] = useState([])

  useEffect(() => {
    // Check if user is logged in and is admin
    const token = localStorage.getItem('token')
    const employeeData = localStorage.getItem('employee')

    if (!token || !employeeData) {
      window.location.href = '/'
      return
    }

    try {
      const parsedEmployee = JSON.parse(employeeData)
      if (parsedEmployee.role !== 'admin') {
        window.location.href = '/dashboard'
        return
      }
      setEmployee(parsedEmployee)
      fetchInitialData(token)
    } catch (error) {
      console.error('Error parsing employee data:', error)
      window.location.href = '/'
    }
  }, [])

  const fetchInitialData = async (token) => {
    try {
      await Promise.all([
        fetchEmployees(token),
        fetchPlatforms(token),
        fetchStats(token)
      ])
    } catch (error) {
      console.error('Error fetching initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async (token) => {
    try {
      const response = await fetch(`${API_URL}/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const result = await response.json()
        setEmployees(result.data.employees || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const fetchPlatforms = async (token) => {
    try {
      const response = await fetch(`${API_URL}/platforms`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const result = await response.json()
        setPlatforms(result.data.platforms || [])
      }
    } catch (error) {
      console.error('Error fetching platforms:', error)
    }
  }

  const fetchStats = async (token) => {
    try {
      const [employeesRes, platformsRes] = await Promise.all([
        fetch(`${API_URL}/employees`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/platforms`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (employeesRes.ok && platformsRes.ok) {
        const employeesData = await employeesRes.json()
        const platformsData = await platformsRes.json()

        const allUsers = employeesData.data.employees || []
        // Filter out admin users - only count actual employees
        const employeesOnly = allUsers.filter(emp => emp.role === 'employee')
        const activeEmployees = employeesOnly.filter(emp => emp.loginTime && !emp.logoutTime)

        setStats({
          totalEmployees: employeesOnly.length,
          activeEmployees: activeEmployees.length,
          inactiveEmployees: employeesOnly.length - activeEmployees.length,
          totalPlatforms: platformsData.data.platforms?.length || 0
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'employees', name: 'Employees', icon: '👥' },
    { id: 'platforms', name: 'Platforms', icon: '🖥️' },
    { id: 'assignments', name: 'Assignments', icon: '🔗' },
    { id: 'logs', name: 'Logs', icon: '📋' }
  ]

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-lg text-gray-600">Manage employees, platforms, and system overview</p>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600">Loading dashboard...</span>
          </div>
        ) : (
          <div>
            {activeTab === 'overview' && <OverviewTab stats={stats} />}
            {activeTab === 'employees' && <EmployeesTab employees={employees} fetchEmployees={() => fetchEmployees(localStorage.getItem('token'))} />}
            {activeTab === 'platforms' && <PlatformsTab platforms={platforms} fetchPlatforms={() => fetchPlatforms(localStorage.getItem('token'))} />}
            {activeTab === 'assignments' && <AssignmentsTab employees={employees} platforms={platforms} refreshData={() => {
              const token = localStorage.getItem('token')
              fetchEmployees(token)
              fetchPlatforms(token)
            }} />}
            {activeTab === 'logs' && <LogsTab />}
          </div>
        )}
      </div>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-white shadow-lg border border-gray-200 rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</div>
          <div className="flex items-center mt-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-500">Registered employees</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg border border-gray-200 rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Active Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.activeEmployees}</div>
          <div className="flex items-center mt-2">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-500">Employees currently logged in</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg border border-gray-200 rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Inactive Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.inactiveEmployees}</div>
          <div className="flex items-center mt-2">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-500">Employees currently logged out</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg border border-gray-200 rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total Platforms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{stats.totalPlatforms}</div>
          <div className="flex items-center mt-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-500">Available platforms</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Employees Tab Component
function EmployeesTab({ employees, fetchEmployees }) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredEmployees, setFilteredEmployees] = useState([])

  // Filter out admin users - only show actual employees
  const employeesOnly = employees.filter(emp => emp.role === 'employee')

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEmployees(employeesOnly)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = employeesOnly.filter(emp =>
        emp.employeeId.toLowerCase().includes(query) ||
        emp.fullName.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.role.toLowerCase().includes(query)
      )
      setFilteredEmployees(filtered)
    }
  }, [searchQuery, employeesOnly])

  const handleEdit = (employee) => {
    setSelectedEmployee(employee)
    setShowEditModal(true)
  }

  const handleDelete = async (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/employees/${employeeId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          fetchEmployees()
          alert('Employee deleted successfully!')
        } else {
          alert('Failed to delete employee')
        }
      } catch (error) {
        console.error('Error deleting employee:', error)
        alert('Error deleting employee')
      }
    }
  }

  return (
    <Card className="bg-white shadow-lg border border-gray-200 rounded-xl">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-800">Employee Management</CardTitle>
            <CardDescription>Create, update, and delete employees ({employeesOnly.length} total)</CardDescription>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Add Employee
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredEmployees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Employee ID</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Name</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Email</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Role</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Status</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm font-medium text-gray-900">{employee.employeeId}</td>
                    <td className="py-3 px-2 text-sm text-gray-700">{employee.fullName}</td>
                    <td className="py-3 px-2 text-sm text-gray-700">{employee.email}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        employee.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {employee.role === 'admin' ? 'Administrator' : 'Employee'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          employee.loginTime && !employee.logoutTime ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                        <span className="text-xs text-gray-600">
                          {employee.loginTime && !employee.logoutTime ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(employee)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(employee._id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No employees found</p>
          </div>
        )}
      </CardContent>

      {/* Create Employee Modal */}
      {showCreateModal && (
        <CreateEmployeeModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchEmployees()
          }}
        />
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <EditEmployeeModal 
          employee={selectedEmployee}
          onClose={() => {
            setShowEditModal(false)
            setSelectedEmployee(null)
          }}
          onSuccess={() => {
            setShowEditModal(false)
            setSelectedEmployee(null)
            fetchEmployees()
          }}
        />
      )}
    </Card>
  )
}

// Platforms Tab Component
function PlatformsTab({ platforms, fetchPlatforms }) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredPlatforms, setFilteredPlatforms] = useState(platforms)

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPlatforms(platforms)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = platforms.filter(platform =>
        platform.platformId.toLowerCase().includes(query) ||
        platform.platformName.toLowerCase().includes(query) ||
        platform.clientName.toLowerCase().includes(query) ||
        platform.url.toLowerCase().includes(query) ||
        platform.email.toLowerCase().includes(query)
      )
      setFilteredPlatforms(filtered)
    }
  }, [searchQuery, platforms])

  const handleEdit = (platform) => {
    setSelectedPlatform(platform)
    setShowEditModal(true)
  }

  const handleToggleStatus = async (platformId, currentStatus) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/platforms/${platformId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (response.ok) {
        fetchPlatforms()
        alert(`Platform ${!currentStatus ? 'activated' : 'deactivated'} successfully!`)
      } else {
        alert('Failed to update platform status')
      }
    } catch (error) {
      console.error('Error updating platform status:', error)
      alert('Error updating platform status')
    }
  }

  const handleDelete = async (platformId) => {
    if (window.confirm('Are you sure you want to delete this platform? This will remove it from all assigned employees.')) {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/platforms/${platformId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          fetchPlatforms()
          alert('Platform deleted successfully!')
        } else {
          alert('Failed to delete platform')
        }
      } catch (error) {
        console.error('Error deleting platform:', error)
        alert('Error deleting platform')
      }
    }
  }

  return (
    <Card className="bg-white shadow-lg border border-gray-200 rounded-xl">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-800">Platform Management</CardTitle>
            <CardDescription>Create, update, and delete platforms ({platforms.length} total)</CardDescription>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search platforms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Add Platform
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredPlatforms.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Platform ID</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Platform Name</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Client Name</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">URL</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Email</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Status</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Assigned</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlatforms.map((platform) => (
                  <tr key={platform._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm font-medium text-gray-900">{platform.platformId}</td>
                    <td className="py-3 px-2 text-sm text-gray-700">{platform.platformName}</td>
                    <td className="py-3 px-2 text-sm text-gray-700">{platform.clientName}</td>
                    <td className="py-3 px-2 text-sm text-blue-600">
                      <a 
                        href={platform.url.startsWith('http') ? platform.url : `https://${platform.url}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline truncate block max-w-40"
                      >
                        {platform.url}
                      </a>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-700">{platform.email}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          platform.isActive ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className={`text-xs font-medium ${
                          platform.isActive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {platform.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-700">
                      {platform.assignedEmployees?.length || 0} employees
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(platform)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(platform._id, platform.isActive)}
                          className={`text-sm font-medium ${
                            platform.isActive 
                              ? 'text-orange-600 hover:text-orange-700' 
                              : 'text-green-600 hover:text-green-700'
                          }`}
                        >
                          {platform.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(platform._id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No platforms found</p>
          </div>
        )}
      </CardContent>

      {/* Create Platform Modal */}
      {showCreateModal && (
        <CreatePlatformModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchPlatforms()
          }}
        />
      )}

      {/* Edit Platform Modal */}
      {showEditModal && selectedPlatform && (
        <EditPlatformModal 
          platform={selectedPlatform}
          onClose={() => {
            setShowEditModal(false)
            setSelectedPlatform(null)
          }}
          onSuccess={() => {
            setShowEditModal(false)
            setSelectedPlatform(null)
            fetchPlatforms()
          }}
        />
      )}
    </Card>
  )
}

// Assignments Tab Component
function AssignmentsTab({ employees, platforms, refreshData }) {
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignments, setAssignments] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredAssignments, setFilteredAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  // Filter employees to only show non-admin users
  const employeesOnly = employees.filter(emp => emp.role === 'employee')

  useEffect(() => {
    fetchAssignments()
  }, [employees, platforms])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAssignments(assignments)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = assignments.filter(assignment =>
        assignment.employeeName.toLowerCase().includes(query) ||
        assignment.employeeId.toLowerCase().includes(query) ||
        assignment.platformName.toLowerCase().includes(query) ||
        assignment.platformId.toLowerCase().includes(query) ||
        assignment.clientName.toLowerCase().includes(query)
      )
      setFilteredAssignments(filtered)
    }
  }, [searchQuery, assignments])

  const fetchAssignments = () => {
    setLoading(true)
    const assignmentList = []

    employeesOnly.forEach(employee => {
      if (employee.assignedPlatforms && employee.assignedPlatforms.length > 0) {
        employee.assignedPlatforms.forEach(platformId => {
          const platform = platforms.find(p => p._id === platformId)
          if (platform) {
            assignmentList.push({
              id: `${employee._id}-${platform._id}`,
              employeeId: employee.employeeId,
              employeeName: employee.fullName,
              employeeEmail: employee.email,
              employeeStatus: employee.loginTime && !employee.logoutTime ? 'Online' : 'Offline',
              platformId: platform.platformId,
              platformName: platform.platformName,
              clientName: platform.clientName,
              platformStatus: platform.isActive ? 'Active' : 'Inactive',
              assignedDate: platform.createdAt || new Date().toISOString(),
              employeeObjectId: employee._id,
              platformObjectId: platform._id
            })
          }
        })
      }
    })

    setAssignments(assignmentList)
    setLoading(false)
  }

  const handleUnassign = async (employeeObjectId, platformObjectId, employeeName, platformName) => {
    if (window.confirm(`Are you sure you want to unassign "${platformName}" from "${employeeName}"?`)) {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/platforms/${platformObjectId}/unassign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ employeeId: employeeObjectId })
        })

        if (response.ok) {
          // Refresh data and assignments
          refreshData()
          alert('Platform unassigned successfully!')
        } else {
          const result = await response.json()
          alert(result.message || 'Failed to unassign platform')
        }
      } catch (error) {
        console.error('Error unassigning platform:', error)
        alert('Error unassigning platform')
      }
    }
  }

  const getUnassignedPlatforms = (employeeId) => {
    const employee = employeesOnly.find(emp => emp._id === employeeId)
    if (!employee) return platforms

    const assignedPlatformIds = employee.assignedPlatforms || []
    return platforms.filter(platform => 
      !assignedPlatformIds.includes(platform._id) && platform.isActive
    )
  }

  const getEmployeesWithoutPlatform = (platformId) => {
    return employeesOnly.filter(employee => {
      const assignedPlatforms = employee.assignedPlatforms || []
      return !assignedPlatforms.includes(platformId)
    })
  }

  return (
    <Card className="bg-white shadow-lg border border-gray-200 rounded-xl">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-800">Platform Assignments</CardTitle>
            <CardDescription>
              Assign platforms to employees ({assignments.length} active assignments)
            </CardDescription>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <button
              onClick={() => setShowAssignModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              New Assignment
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600">Loading assignments...</span>
          </div>
        ) : filteredAssignments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Employee</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Employee Status</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Platform</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Client</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Platform Status</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Assigned Date</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{assignment.employeeName}</div>
                        <div className="text-xs text-gray-500">{assignment.employeeId}</div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          assignment.employeeStatus === 'Online' ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                        <span className="text-xs text-gray-600">{assignment.employeeStatus}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{assignment.platformName}</div>
                        <div className="text-xs text-gray-500">{assignment.platformId}</div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-700">{assignment.clientName}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        assignment.platformStatus === 'Active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {assignment.platformStatus}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-700">
                      {new Date(assignment.assignedDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => handleUnassign(
                          assignment.employeeObjectId, 
                          assignment.platformObjectId,
                          assignment.employeeName,
                          assignment.platformName
                        )}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Unassign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.1-1.1m0-5.656l.707-.707a4 4 0 015.656 0l4 4a4 4 0 11-5.656 5.656l-1.1 1.1" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">No assignments found</p>
            <p className="text-sm text-gray-400 mt-2">
              Create your first assignment by clicking "New Assignment" above
            </p>
          </div>
        )}
      </CardContent>

      {/* Assign Platform Modal */}
      {showAssignModal && (
        <AssignPlatformModal 
          employees={employeesOnly}
          platforms={platforms}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            setShowAssignModal(false)
            // Refresh assignments locally
            refreshData()
          }}
          getUnassignedPlatforms={getUnassignedPlatforms}
          getEmployeesWithoutPlatform={getEmployeesWithoutPlatform}
        />
      )}
    </Card>
  )
}

// Assign Platform Modal Component
function AssignPlatformModal({ employees, platforms, onClose, onSuccess, getUnassignedPlatforms, getEmployeesWithoutPlatform }) {
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      
      if (!selectedEmployee || !selectedPlatform) {
        alert('Please select both an employee and a platform')
        setLoading(false)
        return
      }

      const response = await fetch(`${API_URL}/platforms/${selectedPlatform}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ employeeId: selectedEmployee })
      })

      if (response.ok) {
        alert('Assignment created successfully!')
        onSuccess()
      } else {
        const result = await response.json()
        alert(result.message || 'Failed to assign platform')
      }
    } catch (error) {
      console.error('Error creating assignment:', error)
      alert('Error creating assignment')
    } finally {
      setLoading(false)
    }
  }

  const availablePlatforms = selectedEmployee ? getUnassignedPlatforms(selectedEmployee) : platforms.filter(p => p.isActive)
  const availableEmployees = selectedPlatform ? getEmployeesWithoutPlatform(selectedPlatform) : employees

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Assignment</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select Employee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Choose an employee...</option>
              {availableEmployees.map(employee => (
                <option key={employee._id} value={employee._id}>
                  {employee.fullName} ({employee.employeeId})
                </option>
              ))}
            </select>
          </div>

          {/* Select Platform */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Platform</label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Choose a platform...</option>
              {availablePlatforms.map(platform => (
                <option key={platform._id} value={platform._id}>
                  {platform.platformName} - {platform.clientName} ({platform.platformId})
                </option>
              ))}
            </select>
            {selectedEmployee && availablePlatforms.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">No available platforms for this employee</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-700 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedEmployee || !selectedPlatform}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Create Employee Modal Component
function CreateEmployeeModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'employee'
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('Employee created successfully!')
        onSuccess()
      } else {
        const result = await response.json()
        alert(result.message || 'Failed to create employee')
      }
    } catch (error) {
      console.error('Error creating employee:', error)
      alert('Error creating employee')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Employee</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
            <input
              type="text"
              required
              value={formData.employeeId}
              onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="employee">Employee</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-700 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Employee Modal Component
function EditEmployeeModal({ employee, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    employeeId: employee.employeeId,
    firstName: employee.name.firstName,
    lastName: employee.name.lastName,
    email: employee.email,
    role: employee.role
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/employees/${employee._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('Employee updated successfully!')
        onSuccess()
      } else {
        const result = await response.json()
        alert(result.message || 'Failed to update employee')
      }
    } catch (error) {
      console.error('Error updating employee:', error)
      alert('Error updating employee')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Employee</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
            <input
              type="text"
              required
              value={formData.employeeId}
              onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="employee">Employee</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-700 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Create Platform Modal Component
function CreatePlatformModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    platformId: '',
    platformName: '',
    clientName: '',
    url: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/platforms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('Platform created successfully!')
        onSuccess()
      } else {
        const result = await response.json()
        alert(result.message || 'Failed to create platform')
      }
    } catch (error) {
      console.error('Error creating platform:', error)
      alert('Error creating platform')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Platform</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform ID</label>
              <input
                type="text"
                required
                value={formData.platformId}
                onChange={(e) => setFormData({...formData, platformId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
              <input
                type="text"
                required
                value={formData.platformName}
                onChange={(e) => setFormData({...formData, platformName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
            <input
              type="text"
              required
              value={formData.clientName}
              onChange={(e) => setFormData({...formData, clientName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              type="url"
              required
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-700 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Platform'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Platform Modal Component
function EditPlatformModal({ platform, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    platformId: platform.platformId,
    platformName: platform.platformName,
    clientName: platform.clientName,
    url: platform.url,
    email: platform.email,
    isActive: platform.isActive
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/platforms/${platform._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('Platform updated successfully!')
        onSuccess()
      } else {
        const result = await response.json()
        alert(result.message || 'Failed to update platform')
      }
    } catch (error) {
      console.error('Error updating platform:', error)
      alert('Error updating platform')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Platform</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform ID</label>
              <input
                type="text"
                required
                value={formData.platformId}
                onChange={(e) => setFormData({...formData, platformId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
              <input
                type="text"
                required
                value={formData.platformName}
                onChange={(e) => setFormData({...formData, platformName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
            <input
              type="text"
              required
              value={formData.clientName}
              onChange={(e) => setFormData({...formData, clientName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              type="url"
              required
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.isActive ? 'active' : 'inactive'}
              onChange={(e) => setFormData({...formData, isActive: e.target.value === 'active'})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-700 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Platform'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Logs Tab Component
function LogsTab() {
  const [logs, setLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [logTypeFilter, setLogTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('today')
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    fetchLogs()
  }, [employeeFilter, logTypeFilter, dateFilter])

  useEffect(() => {
    filterLogs()
  }, [logs, searchQuery])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      // Build query parameters
      const queryParams = new URLSearchParams()
      if (employeeFilter !== 'all') {
        queryParams.append('employee', employeeFilter)
      }
      if (logTypeFilter !== 'all') {
        queryParams.append('action', logTypeFilter)
      }
      
      // Add date filters
      const now = new Date()
      let startDate = null
      
      switch (dateFilter) {
        case 'today': {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        }
        case 'yesterday': {
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
          const endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1)
          queryParams.append('startDate', startDate.toISOString())
          queryParams.append('endDate', endDate.toISOString())
          break
        }
        case 'week': {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        }
        case 'month': {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        }
      }
      
      if (startDate && dateFilter !== 'yesterday') {
        queryParams.append('startDate', startDate.toISOString())
      }
      
      // Fetch real logs from API
      const response = await fetch(`${API_URL}/logs?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const result = await response.json()
        // Transform API data to match frontend format
        const transformedLogs = result.data.logs.map(log => ({
          id: log._id,
          timestamp: log.timestamp,
          type: log.action,
          action: log.description,
          employee: {
            id: log.employee.employeeId,
            name: `${log.employee.name.firstName} ${log.employee.name.lastName}`,
            email: log.employee.email,
            objectId: log.employee._id
          },
          platform: log.platform ? {
            id: log.platform.platformId,
            name: log.platform.platformName,
            client: log.platform.clientName
          } : null,
          ipAddress: log.metadata?.ipAddress || 'N/A',
          sessionId: log.metadata?.sessionId || 'N/A',
          userAgent: log.metadata?.userAgent || 'N/A',
          status: log.metadata?.status || 'success',
          duration: log.metadata?.duration ? `${log.metadata.duration} min` : null
        }))
        
        setLogs(transformedLogs)
        
        // Also fetch employees list for the filter
        const employeesRes = await fetch(`${API_URL}/employees`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (employeesRes.ok) {
          const employeesData = await employeesRes.json()
          const employeesOnly = employeesData.data.employees.filter(emp => emp.role === 'employee')
          setEmployees(employeesOnly)
        }
      } else {
        console.error('Failed to fetch logs:', response.statusText)
        setLogs([])
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const filterLogs = () => {
    let filtered = [...logs]
    
    // Search filter (client-side)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(query) ||
        log.employee?.name.toLowerCase().includes(query) ||
        log.employee?.id.toLowerCase().includes(query) ||
        log.platform?.name.toLowerCase().includes(query) ||
        log.ipAddress.toLowerCase().includes(query)
      )
    }
    
    setFilteredLogs(filtered)
  }

  const getLogTypeIcon = (type) => {
    const icons = {
      'login': '🔓',
      'logout': '🔒',
      'platform_access': '🖥️'
    }
    return icons[type] || '📝'
  }

  const getLogTypeColor = (type) => {
    const colors = {
      'login': 'text-green-600 bg-green-100',
      'logout': 'text-red-600 bg-red-100',
      'platform_access': 'text-blue-600 bg-blue-100'
    }
    return colors[type] || 'text-gray-600 bg-gray-100'
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60))
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hour${Math.floor(diffInHours) !== 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    }
  }

  return (
    <Card className="bg-white shadow-lg border border-gray-200 rounded-xl">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-800">Employee Activity Logs</CardTitle>
            <CardDescription>
              Track employee activities and platform usage ({filteredLogs.length} of {logs.length} logs)
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Employee Filter */}
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Employees</option>
              {employees.map(employee => (
                <option key={employee._id} value={employee._id}>
                  {employee.fullName} ({employee.employeeId})
                </option>
              ))}
            </select>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>

            {/* Log Type Filter */}
            <select
              value={logTypeFilter}
              onChange={(e) => setLogTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Types</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="platform_access">Platform Access</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={fetchLogs}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Refresh
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600">Loading employee logs...</span>
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0">
                      <span className="text-lg">{getLogTypeIcon(log.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLogTypeColor(log.type)}`}>
                          {log.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        {log.status === 'failed' && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                            Failed
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">{log.action}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span>
                          <strong>Employee:</strong> {log.employee.name} ({log.employee.id})
                        </span>
                        {log.platform && (
                          <>
                            <span>
                              <strong>Platform:</strong> {log.platform.name} - {log.platform.client}
                            </span>
                            {log.duration && (
                              <span>
                                <strong>Duration:</strong> {log.duration}
                              </span>
                            )}
                          </>
                        )}
                        <span>
                          <strong>IP:</strong> {log.ipAddress}
                        </span>
                        <span>
                          <strong>Session:</strong> {log.sessionId}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatTimestamp(log.timestamp)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">No employee logs found</p>
            <p className="text-sm text-gray-400 mt-2">
              Try adjusting your search criteria or date filter
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AdminDashboard 