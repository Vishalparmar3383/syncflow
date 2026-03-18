"use client"

import { AuthShell } from "@/components/auth/auth-shell"
import { ChangePasswordForm } from "@/components/auth/change-password-form"

export default function ChangePasswordPage() {
  return (
    <AuthShell>
      <ChangePasswordForm />
    </AuthShell>
  )
}

