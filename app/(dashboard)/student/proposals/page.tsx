"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { AlertCircle, ArrowRight, FileText, Loader2, Sparkles } from "lucide-react"

import { StudentPageShell } from "@/components/student/student-page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getApiUrl } from "@/lib/api"

type ProjectType = {
  project_type_id: number
  project_type_name: string
}

type Faculty = {
  staff_id: number
  staff_name: string
  designation?: string | null
  acd_department?: { department_name?: string | null } | null
}

type AcademicYear = {
  academic_year_id: number
  academic_year_code: string
}

const proposalFormSchema = z.object({
  project_group_name: z.string().trim().min(2, "Group name is required."),
  project_title: z.string().trim().min(4, "Project title is required."),
  project_description: z.string().trim().min(20, "Description must be at least 20 characters."),
  project_area: z.string().trim().min(2, "Project area is required."),
  project_type_id: z.string().min(1, "Project type is required."),
  guide_staff_id: z.string().min(1, "Guide selection is required."),
  academic_year_id: z.string().min(1, "Academic year is required."),
})

export default function StudentProposalsPage() {
  const router = useRouter()
  const [types, setTypes] = React.useState<ProjectType[]>([])
  const [faculty, setFaculty] = React.useState<Faculty[]>([])
  const [years, setYears] = React.useState<AcademicYear[]>([])
  const [loadingMeta, setLoadingMeta] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [apiError, setApiError] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({})
  const [formData, setFormData] = React.useState({
    project_group_name: "",
    project_title: "",
    project_description: "",
    project_area: "",
    project_type_id: "",
    guide_staff_id: "",
    academic_year_id: "",
  })

  React.useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [typesResponse, facultyResponse, yearsResponse] = await Promise.all([
          fetch(getApiUrl("/api/master/project-types")),
          fetch(getApiUrl("/api/master/faculty")),
          fetch(getApiUrl("/api/master/academic-years")),
        ])

        const [typesResult, facultyResult, yearsResult] = await Promise.all([
          typesResponse.json(),
          facultyResponse.json(),
          yearsResponse.json(),
        ])

        setTypes(Array.isArray(typesResult) ? typesResult : [])
        setFaculty(Array.isArray(facultyResult) ? facultyResult : [])
        setYears(Array.isArray(yearsResult) ? yearsResult : [])
      } catch (error) {
        console.error(error)
        setApiError("Failed to load proposal metadata.")
      } finally {
        setLoadingMeta(false)
      }
    }

    fetchMeta()
  }, [])

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setApiError(null)

    const parsed = proposalFormSchema.safeParse(formData)
    if (!parsed.success) {
      setFieldErrors(
        Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0] as string, issue.message]))
      )
      return
    }

    setFieldErrors({})
    setSubmitting(true)

    try {
      const response = await fetch(getApiUrl("/api/groups"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })

      const result = await response.json()
      if (!response.ok) {
        setApiError(result.error || "Failed to submit proposal.")
        setSubmitting(false)
        return
      }

      router.push("/student?proposal=success")
    } catch (error) {
      console.error(error)
      setApiError("Failed to submit proposal.")
      setSubmitting(false)
    }
  }

  return (
    <StudentPageShell
      title="Project proposal"
      description="Shape your project idea, connect it to the right academic year and type, and send it to a guide for review."
      metrics={[
        {
          label: "Project types",
          value: types.length,
          hint: "Available categories for your proposal.",
          tone: "sky",
        },
        {
          label: "Guides",
          value: faculty.length,
          hint: "Faculty members available for supervision.",
          tone: "emerald",
        },
        {
          label: "Academic years",
          value: years.length,
          hint: "Available planning windows.",
          tone: "amber",
        },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[28px] border-sky-500/20 bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <FileText className="h-5 w-5 text-sky-600" />
              Submit proposal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMeta ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <Field
                  label="Project group name"
                  error={fieldErrors.project_group_name}
                  input={
                    <Input
                      value={formData.project_group_name}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          project_group_name: event.target.value,
                        }))
                      }
                    />
                  }
                />
                <Field
                  label="Project title"
                  error={fieldErrors.project_title}
                  input={
                    <Input
                      value={formData.project_title}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          project_title: event.target.value,
                        }))
                      }
                    />
                  }
                />
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Academic year"
                    error={fieldErrors.academic_year_id}
                    input={
                      <Select
                        value={formData.academic_year_id}
                        onValueChange={(value) =>
                          setFormData((current) => ({ ...current, academic_year_id: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem
                              key={year.academic_year_id}
                              value={String(year.academic_year_id)}
                            >
                              {year.academic_year_code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    }
                  />
                  <Field
                    label="Project type"
                    error={fieldErrors.project_type_id}
                    input={
                      <Select
                        value={formData.project_type_id}
                        onValueChange={(value) =>
                          setFormData((current) => ({ ...current, project_type_id: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        <SelectContent>
                          {types.map((type) => (
                            <SelectItem
                              key={type.project_type_id}
                              value={String(type.project_type_id)}
                            >
                              {type.project_type_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    }
                  />
                </div>
                <Field
                  label="Project area"
                  error={fieldErrors.project_area}
                  input={
                    <Input
                      value={formData.project_area}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          project_area: event.target.value,
                        }))
                      }
                    />
                  }
                />
                <Field
                  label="Project description"
                  error={fieldErrors.project_description}
                  input={
                    <Textarea
                      className="min-h-40 resize-none"
                      value={formData.project_description}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          project_description: event.target.value,
                        }))
                      }
                    />
                  }
                />
                <Field
                  label="Preferred guide"
                  error={fieldErrors.guide_staff_id}
                  input={
                    <Select
                      value={formData.guide_staff_id}
                      onValueChange={(value) =>
                        setFormData((current) => ({ ...current, guide_staff_id: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select guide" />
                      </SelectTrigger>
                      <SelectContent>
                        {faculty.map((member) => (
                          <SelectItem key={member.staff_id} value={String(member.staff_id)}>
                            {member.staff_name}{" "}
                            {member.acd_department?.department_name
                              ? `· ${member.acd_department.department_name}`
                              : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  }
                />

                {apiError ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {apiError}
                  </div>
                ) : null}

                <Button type="submit" className="rounded-xl" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit proposal"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-violet-500/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-5 w-5 text-violet-600" />
              Before you submit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <ChecklistItem text="Use a clear project title that states the outcome, not just the domain." />
            <ChecklistItem text="Pick the academic year and project type that match your actual submission cycle." />
            <ChecklistItem text="Describe the problem, approach, and expected output in enough detail for a guide to evaluate fit." />
            <ChecklistItem text="Choose a guide whose department or expertise matches the project area." />
            <Button asChild variant="outline" className="rounded-xl bg-background/70">
              <Link href="/student/group">
                Review current group
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </StudentPageShell>
  )
}

function Field({
  label,
  error,
  input,
}: {
  label: string
  error?: string
  input: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {input}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
      {text}
    </div>
  )
}
