"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { getApiUrl } from "@/lib/api"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "Admin" | "Faculty" | "Student"
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(getApiUrl("/api/auth/me"), {
          credentials: "include",
        })

        if (!response.ok) {
          router.push("/login")
          return
        }

        const data = await response.json()
        const userRole = data.user?.role

        if (!userRole) {
          router.push("/login")
          return
        }

        // Check role if required
        if (requiredRole && userRole !== requiredRole) {
          // Redirect to correct dashboard
          const roleRoutes: Record<string, string> = {
            Admin: "/admin",
            Faculty: "/faculty",
            Student: "/student",
          }
          router.push(roleRoutes[userRole] || "/login")
          return
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, requiredRole])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}

