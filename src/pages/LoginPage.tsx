// import React, { useState } from "react"
// import { Button } from "~features/components/ui/button"
// import { Input } from "~features/components/ui/input"

// import { Label } from "~features/components/ui/label"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~features/components/ui/card"
// import { NavLink } from "react-router-dom"

// export default function LoginPage() {
//   const [email, setEmail] = useState("")
//   const [password, setPassword] = useState("")

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     // Handle login logic here
//     console.log("Login:", { email, password })
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-white">
//       <Card className="w-full max-w-md">
//         <CardHeader className="space-y-1">
//           <div className="flex items-center gap-2 mb-4">
//             <div className="w-10 h-10 rounded-lg bg-[#00BABB] flex items-center justify-center">
//               <span className="text-white font-bold text-xl">A</span>
//             </div>
//             <span className="text-2xl font-semibold">AutoFiller</span>
//           </div>
//           <CardTitle className="text-2xl">Welcome back</CardTitle>
//           <CardDescription>Enter your credentials to access your account</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="email">Email</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 placeholder="example@gmail.com"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="password">Password</Label>
//               <Input
//                 id="password"
//                 type="password"
//                 placeholder="Enter your password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//               />
//             </div>
//             <Button type="submit" className="w-full bg-[#00BABB] hover:bg-[#00A5A5]">
//               Sign In
//             </Button>
//           </form>
//           <div className="mt-4 text-center text-sm text-muted-foreground">
//             Don't have an account?{" "}
//             <a
//               href="https://autofiller.com/signup"
//               target="_blank"
//               rel="noopener noreferrer"
//               className="text-[#00BABB] hover:underline"
//             >
//               Sign up
//             </a>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

// src/pages/LoginPage.tsx
import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "~lib/supabaseClient" // 1. Import your client

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // This hook lets you change pages
  const navigate = useNavigate()

  // This function runs when the form is submitted
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault() // Stop the page from reloading
    setLoading(true)
    setError(null)

    // 2. This is the Supabase function to log a user in
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    setLoading(false)

    if (error) {
      setError(error.message) // Show the error from Supabase
    } else {
      // 3. Success! Send the user to the dashboard
      navigate("/dashboard")
    }
  }

  return (
    <div className="flex justify-center items-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">Login</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Show error message if login fails */}
          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md disabled:bg-gray-400 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}