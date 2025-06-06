import logo from "../assets/logo.svg"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLoginForm } from "./hooks/useLoginForm"
import EmailInput from "./components/EmailInput"
import PasswordInput from "./components/PasswordInput"

function LoginForm() {
  const {
    formData,
    isLoading,
    handleInputChange,
    handleSubmit,
    isFormValid
  } = useLoginForm()

  return (
    <div className="flex gap-10 min-h-svh flex-col items-center justify-center bg-[#EBF8FF]">
      <img className="w-80 h-auto" src={logo} alt="logo" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-[600] text-center">Employee Login</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <EmailInput 
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
              />

              <PasswordInput 
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginForm 