"use client"

import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"
import { useSearchParams } from "next/navigation"
import { CheckCircle2 } from "lucide-react"


export default function LoginPage() {
  const searchParams = useSearchParams()
  const signupSuccess = searchParams.get("signup")

  return (
    <AuthShell>
      <div className="space-y-4">
        {signupSuccess === "success" && (
          <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>Account created successfully! Please login with your credentials.</span>
          </div>
        )}
        <LoginForm />
      </div>
    </AuthShell>
  )
}

