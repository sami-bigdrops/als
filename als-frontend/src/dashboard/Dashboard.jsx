import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Navbar from '../components/Navbar'
import PlatformStreaming from '../components/PlatformStreaming'
import { API_URL } from '../config/api'

function Dashboard() {
  const [employee, setEmployee] = useState(null)
  const [assignedPlatforms, setAssignedPlatforms] = useState([])
  const [filteredPlatforms, setFilteredPlatforms] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [showStreaming, setShowStreaming] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const employeeData = localStorage.getItem('employee')

    if (!token || !employeeData) {
      // Redirect to login if no token
      window.location.href = '/'
      return
    }

    try {
      const parsedEmployee = JSON.parse(employeeData)
      
      // Redirect admin to admin dashboard
      if (parsedEmployee.role === 'admin') {
        window.location.href = '/admin'
        return
      }
      
      setEmployee(parsedEmployee)
      
      // Fetch assigned platforms
      fetchAssignedPlatforms(parsedEmployee.id, token)
    } catch (error) {
      console.error('Error parsing employee data:', error)
      window.location.href = '/'
    }
  }, [])

  // Filter platforms based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPlatforms(assignedPlatforms)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = assignedPlatforms.filter(platform =>
        platform.platformName.toLowerCase().includes(query) ||
        platform.clientName.toLowerCase().includes(query) ||
        platform.platformId.toLowerCase().includes(query)
      )
      setFilteredPlatforms(filtered)
    }
  }, [searchQuery, assignedPlatforms])

  const fetchAssignedPlatforms = async (employeeId, token) => {
    console.log(`🔍 DEBUG: Fetching platforms for employee ID: ${employeeId}`)
    console.log(`🔍 DEBUG: Using API URL: ${API_URL}/platforms/employee/${employeeId}`)
    
    try {
      const response = await fetch(`${API_URL}/platforms/employee/${employeeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log(`🔍 DEBUG: Response status: ${response.status}`)
      console.log(`🔍 DEBUG: Response ok: ${response.ok}`)

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ DEBUG: Received result:`, result)
        
        const platforms = result.data.platforms || []
        console.log(`✅ DEBUG: Extracted platforms:`, platforms)
        console.log(`✅ DEBUG: Platforms count: ${platforms.length}`)
        
        setAssignedPlatforms(platforms)
        setFilteredPlatforms(platforms)
      } else {
        const errorText = await response.text()
        console.error('❌ DEBUG: Failed to fetch assigned platforms')
        console.error('❌ DEBUG: Response status:', response.status)
        console.error('❌ DEBUG: Response text:', errorText)
        setAssignedPlatforms([])
        setFilteredPlatforms([])
      }
    } catch (error) {
      console.error('❌ DEBUG: Error fetching assigned platforms:', error)
      setAssignedPlatforms([])
      setFilteredPlatforms([])
    } finally {
      setLoading(false)
    }
  }

  const handlePlatformAccess = (platform) => {
    setSelectedPlatform(platform)
    setShowStreaming(true)
  }

  const closeStreaming = () => {
    setShowStreaming(false)
    setSelectedPlatform(null)
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

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
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {employee.name.firstName}!
          </h1>
          <p className="text-lg text-gray-600">Employee Dashboard</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Employee Information Card */}
          <Card className="bg-white shadow-lg border border-gray-200 rounded-xl overflow-hidden">
            <CardHeader className="bg-white pb-4">
              <CardTitle className="text-xl font-semibold flex items-center text-gray-800">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                Employee Information
              </CardTitle>
              <CardDescription className="text-gray-500 ml-13">
                Your personal details and identification
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Employee ID</span>
                  <span className="text-gray-900 font-semibold bg-blue-50 px-4 py-2 rounded-lg text-sm">
                    {employee.employeeId}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Full Name</span>
                  <span className="text-gray-900 font-medium">{employee.fullName}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Email Address</span>
                  <span className="text-gray-900 font-medium">{employee.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Role</span>
                  <span className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    employee.role === 'admin' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {employee.role === 'admin' ? 'Administrator' : 'Employee'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Login Session Card */}
          <Card className="bg-white shadow-lg border border-gray-200 rounded-xl overflow-hidden">
            <CardHeader className="bg-white pb-4">
              <CardTitle className="text-xl font-semibold flex items-center text-gray-800">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                Active Session
              </CardTitle>
              <CardDescription className="text-gray-500 ml-13">
                Your current login session details
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Login Time</span>
                  <div className="text-right">
                    <div className="text-gray-900 font-medium">
                      {employee.loginTime ? new Date(employee.loginTime).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {employee.loginTime ? new Date(employee.loginTime).toLocaleTimeString() : ''}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Session Status</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-lg text-sm">Active</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Duration</span>
                  <span className="text-gray-900 font-medium bg-gray-50 px-4 py-2 rounded-lg text-sm">
                    {employee.loginTime 
                      ? Math.floor((new Date() - new Date(employee.loginTime)) / (1000 * 60)) + ' min'
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Platforms Card */}
        <Card className="bg-white shadow-lg border border-gray-200 rounded-xl overflow-hidden">
          <CardHeader className="bg-white pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-800">
                    Assigned Platforms
                  </CardTitle>
                  <CardDescription className="text-gray-500 mt-1">
                    Platforms assigned to you for management ({assignedPlatforms.length} total)
                    {searchQuery && ` • ${filteredPlatforms.length} found`}
                  </CardDescription>
                </div>
              </div>
              
              {/* Search Bar */}
              {assignedPlatforms.length > 0 && (
                <div className="lg:w-80">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search platforms..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    />
                    {searchQuery && (
                      <button
                        onClick={clearSearch}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors duration-200"
                      >
                        <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-gray-600">Loading platforms...</span>
              </div>
            ) : filteredPlatforms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlatforms.map((platform) => (
                  <div 
                    key={platform._id} 
                    className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm mb-1">
                          {platform.platformName}
                        </h3>
                        <p className="text-xs text-gray-600 mb-2">
                          Client: {platform.clientName}
                        </p>
                        <p className="text-xs text-gray-500 mb-3">
                          ID: {platform.platformId}
                        </p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${platform.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                    
                    <button
                      onClick={() => handlePlatformAccess(platform)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                    >
                      <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                      </svg>
                      Stream Platform
                    </button>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Platforms Found</h3>
                <p className="text-gray-500 text-sm mb-4">
                  No platforms match your search for "{searchQuery}". Try different keywords.
                </p>
                <button
                  onClick={clearSearch}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Platforms Assigned</h3>
                <p className="text-gray-500 text-sm">
                  You don't have any platforms assigned yet. Contact your administrator for platform access.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Streaming Modal */}
      {showStreaming && selectedPlatform && (
        <PlatformStreaming
          platform={selectedPlatform}
          employee={employee}
          onClose={closeStreaming}
        />
      )}
    </div>
  )
}

export default Dashboard 