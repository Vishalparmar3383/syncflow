"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { motion } from "framer-motion"
import { AlertCircle, ArrowRight, Building2, Calendar, GraduationCap, Loader2, Mail, Phone, ShieldPlus, UserRound } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type UserRole = "Faculty" | "Student"

interface Department {
  department_id: number
  department_name: string
  department_code: string | null
}

interface AcademicYear {
  academic_year_id: number
  academic_year_code: string
}

const baseSchema = z.object({
  role: z.enum(["Faculty", "Student"]),
  email: z.email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm your password"),
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(255, "Name is too long"),
  phone: z.string().trim().regex(/^\d{10}$/, "Phone must be exactly 10 digits").or(z.literal("")),
  departmentId: z.string().min(1, "Select a department"),
  academicYearId: z.string().optional(),
  enrollmentNumber: z.string().optional(),
  cgpa: z.string().optional(),
  designation: z.string().optional(),
})

const signupSchema = baseSchema
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .superRefine((value, context) => {
    if (value.role === "Student") {
      if (!value.enrollmentNumber?.trim()) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["enrollmentNumber"], message: "Enrollment number is required" })
      }
      if (!value.academicYearId?.trim()) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["academicYearId"], message: "Academic year is required" })
      }
      if (value.cgpa && (Number(value.cgpa) < 0 || Number(value.cgpa) > 10)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["cgpa"], message: "CGPA must be between 0 and 10" })
      }
    }

    if (value.role === "Faculty" && !value.designation?.trim()) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["designation"], message: "Designation is required" })
    }
  })

export function SignupForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>("Student")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [enrollmentNumber, setEnrollmentNumber] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [academicYearId, setAcademicYearId] = useState("")
  const [cgpa, setCgpa] = useState("")
  const [designation, setDesignation] = useState("")
  const [departments, setDepartments] = useState<Department[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [departmentResponse, academicYearResponse] = await Promise.all([
          fetch("/api/master/departments"),
          fetch("/api/master/academic-years"),
        ])

        if (departmentResponse.ok) {
          setDepartments(await departmentResponse.json())
        }

        if (academicYearResponse.ok) {
          setAcademicYears(await academicYearResponse.json())
        }
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setApiError(null)

    const parsed = signupSchema.safeParse({
      role,
      email,
      password,
      confirmPassword,
      name,
      phone,
      enrollmentNumber,
      departmentId,
      academicYearId,
      cgpa,
      designation,
    })

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      const nextErrors: Record<string, string> = {}
      for (const [key, value] of Object.entries(fieldErrors)) {
        if (value?.[0]) nextErrors[key] = value[0]
      }
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    const endpoint = parsed.data.role === "Student" ? "/api/auth/register/student" : "/api/auth/register/faculty"
    const payload =
      parsed.data.role === "Student"
        ? {
            email: parsed.data.email,
            password: parsed.data.password,
            student_name: parsed.data.name,
            phone: parsed.data.phone || undefined,
            enrollment_number: parsed.data.enrollmentNumber,
            department_id: Number(parsed.data.departmentId),
            academic_year_id: Number(parsed.data.academicYearId),
            cgpa: parsed.data.cgpa ? Number(parsed.data.cgpa) : 0,
          }
        : {
            email: parsed.data.email,
            password: parsed.data.password,
            staff_name: parsed.data.name,
            phone: parsed.data.phone || undefined,
            department_id: Number(parsed.data.departmentId),
            designation: parsed.data.designation,
          }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        setApiError(data.error || "Registration failed")
        return
      }

      router.push("/login?signup=success")
    } catch {
      setApiError("Unexpected error while creating account")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden rounded-[30px] border-border/60 bg-card/80 shadow-2xl shadow-black/5 backdrop-blur-2xl">
        <CardHeader className="space-y-4 border-b border-border/50 bg-gradient-to-br from-emerald-500/10 via-sky-500/5 to-transparent">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldPlus className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-semibold tracking-tight">Create account</CardTitle>
            <CardDescription className="max-w-xl text-sm leading-6">
              Register as a student or faculty member with schema-backed validation and the fields required by the current database design.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="max-h-[calc(100vh-10rem)] overflow-y-auto p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label>Account type</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as UserRole)} className="grid gap-3 sm:grid-cols-2">
                {[
                  { value: "Student" as const, title: "Student", tint: "border-sky-500/25 bg-sky-500/10" },
                  { value: "Faculty" as const, title: "Faculty", tint: "border-emerald-500/25 bg-emerald-500/10" },
                ].map((item) => (
                  <label
                    key={item.value}
                    htmlFor={`signup-${item.value}`}
                    className={cn("cursor-pointer rounded-2xl border border-border/60 p-4 transition-all", role === item.value ? item.tint : "bg-muted/35 hover:bg-muted/55")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Use the dedicated {item.title.toLowerCase()} route set</p>
                      </div>
                      <RadioGroupItem value={item.value} id={`signup-${item.value}`} />
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="signup-name">{role === "Student" ? "Student name" : "Faculty name"}</Label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="signup-name" value={name} onChange={(event) => setName(event.target.value)} className="h-12 rounded-2xl border-border/60 bg-background/60 pl-10" />
                </div>
                {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="signup-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 rounded-2xl border-border/60 bg-background/60 pl-10" />
                </div>
                {errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-phone"
                    value={phone}
                    maxLength={10}
                    onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="h-12 rounded-2xl border-border/60 bg-background/60 pl-10"
                  />
                </div>
                {errors.phone ? <p className="text-sm text-destructive">{errors.phone}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Select value={departmentId} onValueChange={setDepartmentId} disabled={isLoadingData}>
                    <SelectTrigger className="h-12 rounded-2xl border-border/60 bg-background/60 pl-10">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((department) => (
                        <SelectItem key={department.department_id} value={String(department.department_id)}>
                          {department.department_name}
                          {department.department_code ? ` (${department.department_code})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {errors.departmentId ? <p className="text-sm text-destructive">{errors.departmentId}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 rounded-2xl border-border/60 bg-background/60" />
                {errors.password ? <p className="text-sm text-destructive">{errors.password}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">Confirm password</Label>
                <Input id="signup-confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-12 rounded-2xl border-border/60 bg-background/60" />
                {errors.confirmPassword ? <p className="text-sm text-destructive">{errors.confirmPassword}</p> : null}
              </div>
            </div>

            {role === "Student" ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5 rounded-[26px] border border-sky-500/20 bg-sky-500/5 p-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="enrollment">Enrollment number</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="enrollment" value={enrollmentNumber} onChange={(event) => setEnrollmentNumber(event.target.value)} className="h-12 rounded-2xl border-border/60 bg-background/60 pl-10" />
                  </div>
                  {errors.enrollmentNumber ? <p className="text-sm text-destructive">{errors.enrollmentNumber}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academic-year">Academic year</Label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Select value={academicYearId} onValueChange={setAcademicYearId} disabled={isLoadingData}>
                      <SelectTrigger className="h-12 rounded-2xl border-border/60 bg-background/60 pl-10">
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYears.map((academicYear) => (
                          <SelectItem key={academicYear.academic_year_id} value={String(academicYear.academic_year_id)}>
                            {academicYear.academic_year_code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.academicYearId ? <p className="text-sm text-destructive">{errors.academicYearId}</p> : null}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="cgpa">CGPA</Label>
                  <Input id="cgpa" value={cgpa} onChange={(event) => setCgpa(event.target.value)} placeholder="0.00" className="h-12 rounded-2xl border-border/60 bg-background/60" />
                  {errors.cgpa ? <p className="text-sm text-destructive">{errors.cgpa}</p> : null}
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-[26px] border border-emerald-500/20 bg-emerald-500/5 p-5">
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input id="designation" value={designation} onChange={(event) => setDesignation(event.target.value)} className="h-12 rounded-2xl border-border/60 bg-background/60" />
                  {errors.designation ? <p className="text-sm text-destructive">{errors.designation}</p> : null}
                </div>
              </motion.div>
            )}

            {apiError ? (
              <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                <p>{apiError}</p>
              </div>
            ) : null}

            <Button type="submit" disabled={isLoading || isLoadingData} className="h-12 w-full rounded-2xl bg-primary text-primary-foreground">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Create account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
