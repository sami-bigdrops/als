import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { User } from "iconsax-reactjs"

const EmailInput = ({ value, onChange, disabled = false }) => {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="email" className="text-sm font-[400]">Email</Label>
      <div className="relative">
        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input 
          type="email" 
          id="email" 
          name="email"
          value={value}
          onChange={onChange}
          placeholder="Enter your email" 
          className="rounded-md p-2 pl-10" 
          required
          disabled={disabled}
        />
      </div>
    </div>
  )
}

export default EmailInput 