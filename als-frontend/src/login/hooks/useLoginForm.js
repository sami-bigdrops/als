import { useState } from 'react'
import { toast } from 'sonner'
import { API_URL } from '../../config/api'

export const useLoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Store token and user data
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('employee', JSON.stringify(data.data.employee))
        
        setError('')
        
        // Show success toast
        toast("Login successful! Welcome back.", {
          className: "bg-green-50 border-green-200 text-green-800"
        })

        // Redirect based on role
        setTimeout(() => {
          if (data.data.employee.role === 'admin') {
            window.location.href = '/admin'
          } else {
            window.location.href = '/dashboard'
          }
        }, 1500) // Short delay to show the success message

      } else {
        // Handle login error
        setError(data.message || 'Login failed. Please try again.')
        
        // Show error toast
        toast(data.message || 'Login failed. Please try again.', {
          className: "bg-red-50 border-red-200 text-red-800"
        })
      }
    } catch {
      setError('Network error. Please check your connection.')
      
      // Show network error toast
      toast('Network error. Please check your connection.', {
        className: "bg-red-50 border-red-200 text-red-800"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true)
      
      const token = localStorage.getItem('token')
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      }
    } catch {
      // Logout error handled silently
    } finally {
      // Clear local storage and state regardless of API call success
      localStorage.removeItem('token')
      localStorage.removeItem('employee')
      setFormData({ email: '', password: '' })
      setError('')
      setIsLoading(false)
      
      // Redirect to login
      window.location.href = '/'
    }
  }

  const isFormValid = formData.email && formData.password

  return {
    formData,
    isLoading,
    error,
    handleInputChange,
    handleSubmit,
    isFormValid,
    logout
  }
} 