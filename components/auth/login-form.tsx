"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { motion } from "framer-motion"
import { AlertCircle, ArrowRight, Loader2, Lock, Mail, ShieldCheck } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

type UserRole = "Admin" | "Faculty" | "Student"

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["Admin", "Faculty", "Student"]),
})

const roleCards: { value: UserRole; label: string; tint: string }[] = [
  { value: "Student", label: "Student", tint: "border-sky-500/25 bg-sky-500/10" },
  { value: "Faculty", label: "Faculty", tint: "border-emerald-500/25 bg-emerald-500/10" },
  { value: "Admin", label: "Admin", tint: "border-amber-500/25 bg-amber-500/10" },
]

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("Student")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setApiError(null)

    const parsed = loginSchema.safeParse({ email, password, role })
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: parsed.data.email,
          password: parsed.data.password,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setApiError(data.error || "Login failed")
        return
      }

      if (data.user?.role !== parsed.data.role) {
        setApiError(`This account belongs to ${data.user?.role}. Select the correct role before continuing.`)
        return
      }

      const roleRoutes: Record<UserRole, string> = {
        Admin: "/admin",
        Faculty: "/faculty",
        Student: "/student",
      }

      router.push(roleRoutes[parsed.data.role])
    } catch {
      setApiError("Unexpected error while logging in")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden rounded-[30px] border-border/60 bg-card/80 shadow-2xl shadow-black/5 backdrop-blur-2xl">
        <CardHeader className="space-y-4 border-b border-border/50 bg-gradient-to-br from-sky-500/10 via-emerald-500/5 to-transparent">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-semibold tracking-tight">Sign in</CardTitle>
            <CardDescription className="max-w-lg text-sm leading-6">
              Choose the correct role, then continue into the role-specific workspace with your account credentials.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label>Select your role</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as UserRole)} className="grid gap-3 sm:grid-cols-3">
                {roleCards.map((roleCard) => (
                  <label
                    key={roleCard.value}
                    htmlFor={`role-${roleCard.value}`}
                    className={cn(
                      "cursor-pointer rounded-2xl border border-border/60 p-4 transition-all",
                      role === roleCard.value ? roleCard.tint : "bg-muted/35 hover:bg-muted/55"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{roleCard.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Access your dashboard</p>
                      </div>
                      <RadioGroupItem value={roleCard.value} id={`role-${roleCard.value}`} />
                    </div>
                  </label>
                ))}
              </RadioGroup>
              {errors.role ? <p className="text-sm text-destructive">{errors.role}</p> : null}
            </div>

            <div className="grid gap-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
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

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      setErrors((current) => ({ ...current, password: "" }))
                    }}
                    placeholder="Enter your password"
                    className="h-12 rounded-2xl border-border/60 bg-background/60 pl-10"
                  />
                </div>
                {errors.password ? <p className="text-sm text-destructive">{errors.password}</p> : null}
              </div>
            </div>

            {apiError ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                <p>{apiError}</p>
              </motion.div>
            ) : null}

            <Button type="submit" disabled={isLoading} className="h-12 w-full rounded-2xl bg-primary text-primary-foreground">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Continue to workspace
            </Button>
          </form>

          <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/35 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Need a new account?</p>
              <p className="text-sm text-muted-foreground">Student and faculty registration is available here.</p>
            </div>
            <Button asChild variant="outline" className="rounded-2xl">
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
