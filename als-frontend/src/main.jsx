import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { LoginForm } from './login'
import Dashboard from './dashboard/Dashboard'
import AdminDashboard from './dashboard/AdminDashboard'
import { Toaster } from '@/components/ui/sonner'

// Simple routing based on pathname
const App = () => {
  const path = window.location.pathname

  if (path === '/dashboard') {
    return <Dashboard />
  }

  if (path === '/admin') {
    return <AdminDashboard />
  }

  return <LoginForm />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster />
  </StrictMode>,
)
