"use client"

import * as React from "react"
import { CalendarRange, Loader2, Plus } from "lucide-react"
import { z } from "zod"

import { AdminPageShell } from "@/components/admin/admin-page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { getApiUrl } from "@/lib/api"

type AcademicYear = {
  academic_year_id: number
  academic_year_code: string
  start_date: string
  end_date: string
  is_active?: boolean | null
  description?: string | null
}

const academicYearFormSchema = z
  .object({
    academic_year_code: z.string().trim().min(4, "Code must be at least 4 characters."),
    start_date: z.string().min(1, "Start date is required."),
    end_date: z.string().min(1, "End date is required."),
    is_active: z.boolean().optional(),
    description: z.string().trim().max(1000, "Description is too long.").optional(),
  })
  .refine((value) => new Date(value.start_date) <= new Date(value.end_date), {
    message: "End date must be after start date.",
    path: ["end_date"],
  })

export default function AdminAcademicYearsPage() {
  const [years, setYears] = React.useState<AcademicYear[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({})
  const [formData, setFormData] = React.useState({
    academic_year_code: "",
    start_date: "",
    end_date: "",
    is_active: false,
    description: "",
  })

  const fetchYears = React.useCallback(async () => {
    try {
      const response = await fetch(getApiUrl("/api/admin/academic-years"))
      const data = await response.json()
      setYears(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
      setYears([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchYears()
  }, [fetchYears])

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault()
    const parsed = academicYearFormSchema.safeParse({
      ...formData,
      description: formData.description || undefined,
    })

    if (!parsed.success) {
      setFormErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path[0] as string, issue.message])
        )
      )
      return
    }

    setFormErrors({})
    setSubmitting(true)

    try {
      const response = await fetch(getApiUrl("/api/admin/academic-years"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })

      if (response.ok) {
        await fetchYears()
        setIsAddOpen(false)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminPageShell
      title="Academic year planning"
      description="Keep project calendars current, mark the active cycle, and preserve visibility into historical sessions."
      metrics={[
        {
          label: "Configured years",
          value: years.length,
          hint: "Academic year records in the system.",
        },
        {
          label: "Active session",
          value: years.find((year) => year.is_active)?.academic_year_code || "None",
          hint: "The cycle used by current project operations.",
        },
      ]}
      action={
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 rounded-xl px-5">
              <Plus className="mr-2 h-4 w-4" />
              New academic year
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[28px] border-amber-500/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(255,255,255,0)),hsl(var(--background))]">
            <DialogHeader>
              <DialogTitle>Create academic year</DialogTitle>
              <DialogDescription>
                Add a session window and optionally make it active immediately.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="academic_year_code">Code</Label>
                <Input
                  id="academic_year_code"
                  value={formData.academic_year_code}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      academic_year_code: event.target.value,
                    }))
                  }
                  placeholder="AY2026-27"
                  required
                />
                {formErrors.academic_year_code ? (
                  <p className="text-sm text-destructive">{formErrors.academic_year_code}</p>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        start_date: event.target.value,
                      }))
                    }
                    required
                  />
                  {formErrors.start_date ? (
                    <p className="text-sm text-destructive">{formErrors.start_date}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        end_date: event.target.value,
                      }))
                    }
                    required
                  />
                  {formErrors.end_date ? (
                    <p className="text-sm text-destructive">{formErrors.end_date}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div>
                  <p className="font-medium">Set as active session</p>
                  <p className="text-sm text-muted-foreground">
                    This session becomes the default operating year.
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(value) =>
                    setFormData((current) => ({ ...current, is_active: value }))
                  }
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex h-64 items-center justify-center rounded-[28px] border border-border/60 bg-background/90">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : (
          years.map((year) => (
            <Card
              key={year.academic_year_id}
              className={cn(
                "rounded-[28px] border-amber-500/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none",
                year.is_active && "border-emerald-500/30 bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))]"
              )}
            >
              <CardContent className="space-y-5 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                      Session
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold">{year.academic_year_code}</h3>
                  </div>
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-700">
                    <CalendarRange className="h-5 w-5" />
                  </div>
                </div>
                {year.is_active ? <Badge className="rounded-full bg-emerald-600">Active</Badge> : null}
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    {new Date(year.start_date).toLocaleDateString()} to{" "}
                    {new Date(year.end_date).toLocaleDateString()}
                  </p>
                  <p>{year.description || "No description provided."}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AdminPageShell>
  )
}
