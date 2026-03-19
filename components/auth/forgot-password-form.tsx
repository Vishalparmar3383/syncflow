"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { z } from "zod"
import { motion } from "framer-motion"
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Lock, Mail, ShieldEllipsis } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getApiUrl } from "@/lib/api"

const requestSchema = z.object({
  email: z.email("Enter a valid email address"),
})

const resetSchema = z
  .object({
    email: z.email("Enter a valid email address"),
    otp: z.string().trim().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export function ForgotPasswordForm({ className, ...props }: React.ComponentProps<"div">) {
  const [step, setStep] = useState<"request" | "verify">("request")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [devOtp, setDevOtp] = useState<string | null>(null)

  const otpHint = useMemo(() => (devOtp ? `Demo OTP: ${devOtp}` : null), [devOtp])

  const handleRequestOtp = async (event: React.FormEvent) => {
    event.preventDefault()
    setApiError(null)
    setSuccessMessage(null)

    const parsed = requestSchema.safeParse({ email })
    if (!parsed.success) {
      setErrors({ email: parsed.error.flatten().fieldErrors.email?.[0] ?? "Email is required" })
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const response = await fetch(getApiUrl("/api/auth/forgot-password/request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })

      const data = await response.json()
      if (!response.ok) {
        setApiError(data.error || "Unable to generate OTP")
        return
      }

      setDevOtp(data.devOtp ?? null)
      setSuccessMessage(data.message || "OTP generated. Continue to verification.")
      setStep("verify")
    } catch {
      setApiError("Unexpected error while preparing reset flow")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault()
    setApiError(null)
    setSuccessMessage(null)

    const parsed = resetSchema.safeParse({ email, otp, newPassword, confirmPassword })
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {}
      for (const [key, value] of Object.entries(parsed.error.flatten().fieldErrors)) {
        if (value?.[0]) nextErrors[key] = value[0]
      }
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const response = await fetch(getApiUrl("/api/auth/forgot-password/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })

      const data = await response.json()
      if (!response.ok) {
        setApiError(data.error || "OTP verification failed")
        return
      }

      setSuccessMessage(data.message || "Password updated successfully.")
      setOtp("")
      setNewPassword("")
      setConfirmPassword("")
      setDevOtp(null)
    } catch {
      setApiError("Unexpected error while verifying OTP")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden rounded-[30px] border-border/60 bg-card/75 shadow-2xl shadow-black/5 backdrop-blur-2xl">
        <CardHeader className="space-y-3 border-b border-border/50 bg-gradient-to-br from-sky-500/10 via-emerald-500/5 to-transparent">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldEllipsis className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-2xl font-semibold">Forgot password</CardTitle>
            <CardDescription className="mt-2 text-sm leading-6">
              Request a six-digit OTP, validate it, then reset the password. OTP delivery is not configured, so a demo code is shown locally.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className={cn("rounded-2xl border p-4", step === "request" ? "border-sky-500/30 bg-sky-500/10" : "border-border/60 bg-muted/40")}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600 dark:text-sky-300">Step 1</p>
              <p className="mt-2 font-medium">Generate OTP</p>
            </div>
            <div className={cn("rounded-2xl border p-4", step === "verify" ? "border-emerald-500/30 bg-emerald-500/10" : "border-border/60 bg-muted/40")}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-300">Step 2</p>
              <p className="mt-2 font-medium">Verify and reset</p>
            </div>
          </div>

          {successMessage ? (
            <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" />
              <div className="space-y-1">
                <p>{successMessage}</p>
                {otpHint ? <p className="font-medium">{otpHint}</p> : null}
              </div>
            </div>
          ) : null}

          {apiError ? (
            <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
              <p>{apiError}</p>
            </div>
          ) : null}

          {step === "request" ? (
            <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleRequestOtp} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      setErrors((current) => ({ ...current, email: "" }))
                    }}
                    placeholder="name@example.com"
                    className="h-12 rounded-2xl border-border/60 bg-background/60 pl-10"
                  />
                </div>
                {errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
              </div>

              <Button type="submit" disabled={isLoading} className="h-12 w-full rounded-2xl bg-primary text-primary-foreground">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                Generate OTP
              </Button>
            </motion.form>
          ) : (
            <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="verify-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="verify-email" value={email} readOnly className="h-12 rounded-2xl border-border/60 bg-muted/50 pl-10" />
                  </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="otp">OTP</Label>
                  <div className="relative">
                    <ShieldEllipsis className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="otp"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(event) => {
                        setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                        setErrors((current) => ({ ...current, otp: "" }))
                      }}
                      placeholder="Enter 6-digit OTP"
                      className="h-12 rounded-2xl border-border/60 bg-background/60 pl-10"
                    />
                  </div>
                  {errors.otp ? <p className="text-sm text-destructive">{errors.otp}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-password">New password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="reset-password"
                      type="password"
                      value={newPassword}
                      onChange={(event) => {
                        setNewPassword(event.target.value)
                        setErrors((current) => ({ ...current, newPassword: "" }))
                      }}
                      className="h-12 rounded-2xl border-border/60 bg-background/60 pl-10"
                    />
                  </div>
                  {errors.newPassword ? <p className="text-sm text-destructive">{errors.newPassword}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-confirm-password">Confirm password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="reset-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value)
                        setErrors((current) => ({ ...current, confirmPassword: "" }))
                      }}
                      className="h-12 rounded-2xl border-border/60 bg-background/60 pl-10"
                    />
                  </div>
                  {errors.confirmPassword ? <p className="text-sm text-destructive">{errors.confirmPassword}</p> : null}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" variant="outline" onClick={() => setStep("request")} className="h-12 flex-1 rounded-2xl">
                  Back
                </Button>
                <Button type="submit" disabled={isLoading} className="h-12 flex-1 rounded-2xl bg-primary text-primary-foreground">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Verify OTP
                </Button>
              </div>
            </motion.form>
          )}

          <div className="text-center text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
