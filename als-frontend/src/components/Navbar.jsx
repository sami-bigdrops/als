import logo from "../assets/logo.svg"
import { Button } from "@/components/ui/button"
import { useLoginForm } from "../login/hooks/useLoginForm"

function Navbar() {
  const { logout } = useLoginForm()

  const handleLogout = () => {
    logout()
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img 
              className="h-8 w-auto" 
              src={logo} 
              alt="BDM Group" 
            />
          </div>
          
          {/* Logout Button */}
          <div className="flex items-center">
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 