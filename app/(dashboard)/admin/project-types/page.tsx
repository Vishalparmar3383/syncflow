"use client"

import * as React from "react"
import { BookOpen, Loader2, Plus } from "lucide-react"
import { z } from "zod"

import { AdminPageShell } from "@/components/admin/admin-page-shell"
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
import { Textarea } from "@/components/ui/textarea"
import { getApiUrl } from "@/lib/api"

type ProjectType = {
  project_type_id: number
  project_type_name: string
  description?: string | null
}

const projectTypeFormSchema = z.object({
  project_type_name: z.string().trim().min(2, "Name must be at least 2 characters."),
  description: z.string().trim().max(1000, "Description is too long.").optional(),
})

export default function AdminProjectTypesPage() {
  const [types, setTypes] = React.useState<ProjectType[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({})
  const [formData, setFormData] = React.useState({
    project_type_name: "",
    description: "",
  })

  const fetchTypes = React.useCallback(async () => {
    try {
      const response = await fetch(getApiUrl("/api/admin/project-types"))
      const data = await response.json()
      setTypes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
      setTypes([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchTypes()
  }, [fetchTypes])

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault()
    const parsed = projectTypeFormSchema.safeParse({
      project_type_name: formData.project_type_name,
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
      const response = await fetch(getApiUrl("/api/admin/project-types"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })

      if (response.ok) {
        await fetchTypes()
        setIsAddOpen(false)
        setFormData({ project_type_name: "", description: "" })
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminPageShell
      title="Project type catalog"
      description="Define the project categories used across the institution so teams, reviewers, and reports stay aligned."
      metrics={[
        {
          label: "Project types",
          value: types.length,
          hint: "Categories currently available for project setup.",
        },
      ]}
      action={
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 rounded-xl px-5">
              <Plus className="mr-2 h-4 w-4" />
              Add project type
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[28px] border-emerald-500/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(255,255,255,0)),hsl(var(--background))]">
            <DialogHeader>
              <DialogTitle>Create project type</DialogTitle>
              <DialogDescription>
                Add a category that groups related projects under the same delivery model.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project_type_name">Name</Label>
                <Input
                  id="project_type_name"
                  value={formData.project_type_name}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      project_type_name: event.target.value,
                    }))
                  }
                  required
                />
                {formErrors.project_type_name ? (
                  <p className="text-sm text-destructive">{formErrors.project_type_name}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="min-h-28 resize-none"
                />
                {formErrors.description ? (
                  <p className="text-sm text-destructive">{formErrors.description}</p>
                ) : null}
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
          types.map((type) => (
            <Card
              key={type.project_type_id}
              className="rounded-[28px] border-emerald-500/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none"
            >
              <CardContent className="space-y-5 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                      Project type
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold">{type.project_type_name}</h3>
                  </div>
                  <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-700">
                    <BookOpen className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {type.description || "No description provided."}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AdminPageShell>
  )
}
