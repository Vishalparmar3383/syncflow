"use client"

import { AuthShell } from "@/components/auth/auth-shell"
import { SignupForm } from "@/components/auth/signup-form"


export default function RegisterPage() {
  return (
    <AuthShell>
      <SignupForm />
    </AuthShell>
  )
}

