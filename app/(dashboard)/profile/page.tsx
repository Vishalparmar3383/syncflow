"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { z } from "zod"
import { Building2, Loader2, Mail, Save, UserRound } from "lucide-react"

import { ProfilePageShell } from "@/components/profile/profile-page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { getApiUrl } from "@/lib/api"

interface ProfileState {
  role: "Admin" | "Faculty" | "Student"
  email: string
  name: string
  phone: string
  description: string
  department: string | null
  designation: string | null
  academicYear: string | null
  enrollmentNumber: string | null
}

const profileSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  phone: z.string().trim().regex(/^\d{10}$/, "Phone must be exactly 10 digits").or(z.literal("")),
  description: z.string().trim().max(500, "Description is too long").optional(),
  designation: z.string().trim().max(100, "Designation is too long").optional(),
})

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileState | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const response = await fetch(getApiUrl("/api/account/profile"))
      if (response.ok) {
        setProfile(await response.json())
      }
      setIsLoading(false)
    }

    load()
  }, [])

  const updateField = (field: keyof ProfileState, value: string) => {
    if (!profile) return
    setProfile({ ...profile, [field]: value })
    setErrors((current) => ({ ...current, [field]: "" }))
    setMessage(null)
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!profile) return

    const parsed = profileSchema.safeParse({
      name: profile.name,
      phone: profile.phone,
      description: profile.description,
      designation: profile.designation ?? "",
    })

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {}
      for (const [key, value] of Object.entries(parsed.error.flatten().fieldErrors)) {
        if (value?.[0]) nextErrors[key] = value[0]
      }
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setIsSaving(true)
    setMessage(null)

    const response = await fetch(getApiUrl("/api/account/profile"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    })

    const data = await response.json()
    setIsSaving(false)
    setMessage(data.message || (response.ok ? "Profile updated." : "Unable to update profile."))
  }

  if (isLoading || !profile) {
    return (
      <ProfilePageShell title="Profile" description="Loading your account details." accent="sky">
        <div className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-border/60 bg-card/70">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </ProfilePageShell>
    )
  }

  return (
    <ProfilePageShell title="Profile" description="Review your role details and update the editable account fields for this workspace." accent="sky">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-[28px] border-border/60 bg-card/75">
          <CardHeader>
            <CardTitle>Identity summary</CardTitle>
            <CardDescription>Schema-backed account snapshot for the current logged-in user.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-primary/10 text-primary">
              <UserRound className="h-9 w-9" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{profile.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{profile.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-sky-500/15 text-sky-700 shadow-none dark:text-sky-300">{profile.role}</Badge>
              {profile.department ? <Badge className="bg-emerald-500/15 text-emerald-700 shadow-none dark:text-emerald-300">{profile.department}</Badge> : null}
              {profile.academicYear ? <Badge className="bg-amber-500/15 text-amber-700 shadow-none dark:text-amber-300">{profile.academicYear}</Badge> : null}
            </div>
            <div className="grid gap-4">
              <div className="rounded-2xl border border-border/60 bg-muted/35 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Enrollment</p>
                <p className="mt-2 font-medium">{profile.enrollmentNumber ?? "Not applicable"}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/35 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Designation</p>
                <p className="mt-2 font-medium">{profile.designation ?? "Not applicable"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-border/60 bg-card/75">
          <CardHeader>
            <CardTitle>Edit details</CardTitle>
            <CardDescription>Only editable fields are exposed here. Role-specific read-only values stay in the summary panel.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Name</Label>
                  <Input id="profile-name" value={profile.name} onChange={(event) => updateField("name", event.target.value)} className="h-12 rounded-2xl" />
                  {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-phone">Phone</Label>
                  <Input id="profile-phone" value={profile.phone} onChange={(event) => updateField("phone", event.target.value.replace(/\D/g, "").slice(0, 10))} className="h-12 rounded-2xl" />
                  {errors.phone ? <p className="text-sm text-destructive">{errors.phone}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="profile-email" value={profile.email} readOnly className="h-12 rounded-2xl bg-muted/45 pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-department">Department</Label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="profile-department" value={profile.department ?? "Not assigned"} readOnly className="h-12 rounded-2xl bg-muted/45 pl-10" />
                  </div>
                </div>
                {profile.role === "Faculty" ? (
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="profile-designation">Designation</Label>
                    <Input id="profile-designation" value={profile.designation ?? ""} onChange={(event) => updateField("designation", event.target.value)} className="h-12 rounded-2xl" />
                    {errors.designation ? <p className="text-sm text-destructive">{errors.designation}</p> : null}
                  </div>
                ) : null}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="profile-description">Description</Label>
                  <Textarea id="profile-description" value={profile.description} onChange={(event) => updateField("description", event.target.value)} className="min-h-32 rounded-2xl" placeholder="Add a short description about this account." />
                  {errors.description ? <p className="text-sm text-destructive">{errors.description}</p> : null}
                </div>
              </div>

              {message ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">{message}</div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" disabled={isSaving} className="h-12 rounded-2xl bg-primary text-primary-foreground">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save profile
                </Button>
                <Button type="button" asChild variant="outline" className="h-12 rounded-2xl">
                  <Link href="/change-password">Change password</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProfilePageShell>
  )
}
