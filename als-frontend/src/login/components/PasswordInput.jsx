import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Lock, Eye, EyeSlash } from "iconsax-reactjs"

const PasswordInput = ({ value, onChange, disabled = false }) => {
  const [showPassword, setShowPassword] = useState(false)

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="password" className="text-sm font-[400]">Password</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input 
          type={showPassword ? "text" : "password"} 
          id="password" 
          name="password"
          value={value}
          onChange={onChange}
          placeholder="Enter your password" 
          className="rounded-md p-2 pl-10 pr-10" 
          required
          disabled={disabled}
        />
        <button 
          type="button" 
          onClick={togglePasswordVisibility} 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:text-gray-600 focus:outline-none"
          disabled={disabled}
        >
          {showPassword ? <EyeSlash size={18} className="text-gray-400" /> : <Eye size={18} className="text-gray-400" />}
        </button>
      </div>
    </div>
  )
}

export default PasswordInput 