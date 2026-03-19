"use client"

import * as React from "react"
import { Building2, Loader2, Plus, Search } from "lucide-react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { getApiUrl } from "@/lib/api"

type Department = {
  department_id: number
  department_name: string
  department_code?: string | null
  description?: string | null
}

const departmentFormSchema = z.object({
  department_name: z.string().trim().min(2, "Department name must be at least 2 characters."),
  department_code: z.string().trim().min(1, "Department code is required.").max(10, "Department code is too long."),
  description: z.string().trim().max(1000, "Description is too long.").optional(),
})

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = React.useState<Department[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [formData, setFormData] = React.useState({
    department_name: "",
    department_code: "",
    description: "",
  })
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({})

  const fetchDepartments = React.useCallback(async () => {
    try {
      const response = await fetch(getApiUrl("/api/admin/departments"))
      const data = await response.json()
      setDepartments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
      setDepartments([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  const filtered = departments.filter((department) => {
    const query = searchQuery.toLowerCase()

    return (
      department.department_name?.toLowerCase().includes(query) ||
      department.department_code?.toLowerCase().includes(query) ||
      department.description?.toLowerCase().includes(query)
    )
  })

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault()
    const parsed = departmentFormSchema.safeParse({
      department_name: formData.department_name,
      department_code: formData.department_code,
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
      const response = await fetch(getApiUrl("/api/admin/departments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department_name: parsed.data.department_name,
          department_code: parsed.data.department_code,
          description: parsed.data.description || "",
        }),
      })

      if (response.ok) {
        await fetchDepartments()
        setIsAddOpen(false)
        setFormData({
          department_name: "",
          department_code: "",
          description: "",
        })
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminPageShell
      title="Department management"
      description="Define the academic structure that connects students, faculty, and project ownership across the platform."
      metrics={[
        {
          label: "Departments",
          value: departments.length,
          hint: "Academic units currently configured.",
        },
        {
          label: "Search results",
          value: filtered.length,
          hint: "Records matching the active query.",
        },
      ]}
      action={
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 rounded-xl px-5">
              <Plus className="mr-2 h-4 w-4" />
              Add department
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[28px] border-sky-500/20 bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(255,255,255,0)),hsl(var(--background))]">
            <DialogHeader>
              <DialogTitle>Create department</DialogTitle>
              <DialogDescription>
                Add a new academic unit and assign a short code for reporting.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="department_name">Department name</Label>
                <Input
                  id="department_name"
                  value={formData.department_name}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      department_name: event.target.value,
                    }))
                  }
                  required
                />
                {formErrors.department_name ? (
                  <p className="text-sm text-destructive">{formErrors.department_name}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="department_code">Department code</Label>
                <Input
                  id="department_code"
                  value={formData.department_code}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      department_code: event.target.value.toUpperCase(),
                    }))
                  }
                  required
                />
                {formErrors.department_code ? (
                  <p className="text-sm text-destructive">{formErrors.department_code}</p>
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
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <Card className="rounded-[28px] border-sky-500/20 bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
        <CardContent className="space-y-6 p-6">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, code, or description"
              className="h-11 rounded-xl pl-9"
            />
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((department) => (
                  <TableRow key={department.department_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-sky-500/10 p-2 text-sky-700">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{department.department_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-full border-sky-500/30 bg-sky-500/10 text-sky-700">
                        {department.department_code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {department.description || "No description provided"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminPageShell>
  )
}
