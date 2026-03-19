"use client"

import * as React from "react"
import { z } from "zod"
import { Download, FileCode2, FileText, FolderOpen, Loader2, Presentation, Upload } from "lucide-react"

import { StudentPageShell } from "@/components/student/student-page-shell"
import { Badge } from "@/components/ui/badge"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getApiUrl } from "@/lib/api"

type DashboardProject = {
  project_group_id: number
  project_title: string
  project_group_name: string
} 

type DashboardData = {
  projects?: DashboardProject[]
}

type DocumentRecord = {
  document_id: number
  document_name: string
  document_type: "Proposal" | "Report" | "Code" | "Presentation" | "Other"
  document_path?: string | null
  file_size?: string | null
  uploaded_at?: string | null
  review?: {
    studentNote?: string
    reviewStatus?: "Pending review" | "Accepted" | "Rejected"
    reviewNote?: string
    reviewedBy?: string
    reviewedAt?: string
  }
}

const documentUploadSchema = z.object({
  document_type: z.enum(["Proposal", "Report", "Code", "Presentation", "Other"]),
  description: z.string().trim().max(1000).optional(),
  file: z.instanceof(File, { message: "File is required." }),
  project_group_id: z.string().min(1, "Project selection is required."),
})

export default function StudentDocumentsPage() {
  const [projects, setProjects] = React.useState<DashboardProject[]>([])
  const [selectedProjectId, setSelectedProjectId] = React.useState("")
  const [documents, setDocuments] = React.useState<DocumentRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [uploading, setUploading] = React.useState(false)
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({})
  const [apiError, setApiError] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState<{
    file: File | null
    document_type: "" | "Proposal" | "Report" | "Code" | "Presentation" | "Other"
    description: string
    project_group_id: string
  }>({
    file: null,
    document_type: "",
    description: "",
    project_group_id: "",
  })

  const fetchDocuments = React.useCallback(async (projectGroupId: number) => {
    const response = await fetch(getApiUrl(`/api/projects/documents?group_id=${projectGroupId}`))
    const result = await response.json()
    setDocuments(Array.isArray(result) ? result : [])
  }, [])

  React.useEffect(() => {
    const fetchInitial = async () => {
      try {
        const dashboardResponse = await fetch(getApiUrl("/api/student/dashboard"))
        const dashboard = (await dashboardResponse.json()) as DashboardData
        const nextProjects = dashboard.projects || []
        setProjects(nextProjects)

        if (nextProjects.length) {
          const firstProjectId = String(nextProjects[0].project_group_id)
          setSelectedProjectId(firstProjectId)
          setFormData((current) => ({ ...current, project_group_id: firstProjectId }))
          await fetchDocuments(nextProjects[0].project_group_id)
        }
      } catch (error) {
        console.error(error)
        setApiError("Failed to load documents.")
      } finally {
        setLoading(false)
      }
    }

    fetchInitial()
  }, [fetchDocuments])

  const handleProjectChange = async (value: string) => {
    setSelectedProjectId(value)
    setFormData((current) => ({ ...current, project_group_id: value }))
    await fetchDocuments(Number(value))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const parsed = documentUploadSchema.safeParse({
      document_type: formData.document_type,
      description: formData.description || undefined,
      file: formData.file,
      project_group_id: formData.project_group_id,
    })

    if (!parsed.success) {
      setFieldErrors(
        Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0] as string, issue.message]))
      )
      return
    }

    setFieldErrors({})
    setApiError(null)
    setUploading(true)

    try {
      const payload = new FormData()
      payload.append("file", parsed.data.file)
      payload.append("project_group_id", parsed.data.project_group_id)
      payload.append("document_type", parsed.data.document_type)
      payload.append("description", parsed.data.description || "")

      const response = await fetch(getApiUrl("/api/projects/documents"), {
        method: "POST",
        body: payload,
      })

      const result = await response.json()
      if (!response.ok) {
        setApiError(result.error || "Failed to upload document.")
        setUploading(false)
        return
      }

      await fetchDocuments(Number(parsed.data.project_group_id))
      setFormData((current) => ({
        ...current,
        file: null,
        document_type: "",
        description: "",
      }))
      setUploading(false)
    } catch (error) {
      console.error(error)
      setApiError("Failed to upload document.")
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-[28px] border border-border/60 bg-background/90">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    )
  }

  if (!projects.length) {
    return (
      <StudentPageShell
        title="Project documents"
        description="You can upload documents once at least one project group is active."
      >
        <Card className="rounded-[28px] border-amber-500/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
          <CardContent className="p-8 text-sm text-muted-foreground">
            No project groups found.
          </CardContent>
        </Card>
      </StudentPageShell>
    )
  }

  const selectedProject =
    projects.find((project) => String(project.project_group_id) === selectedProjectId) || projects[0]

  return (
    <StudentPageShell
      title="Project documents"
      description={`Manage files for ${selectedProject.project_group_name} and track faculty review on each upload.`}
      metrics={[
        {
          label: "Documents",
          value: documents.length,
          hint: "Files uploaded for the selected project.",
          tone: "sky",
        },
        {
          label: "Pending review",
          value: documents.filter((document) => document.review?.reviewStatus === "Pending review").length,
          hint: "Uploads waiting for faculty review.",
          tone: "amber",
        },
        {
          label: "Evaluated",
          value: documents.filter((document) => document.review?.reviewStatus !== "Pending review").length,
          hint: "Uploads already evaluated by faculty.",
          tone: "emerald",
        },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-[28px] border-emerald-500/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Upload className="h-5 w-5 text-emerald-600" />
              Upload document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={selectedProjectId} onValueChange={handleProjectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.project_group_id} value={String(project.project_group_id)}>
                        {project.project_group_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.project_group_id ? (
                  <p className="text-sm text-destructive">{fieldErrors.project_group_id}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Document type</Label>
                <Select
                  value={formData.document_type}
                  onValueChange={(value) =>
                    setFormData((current) => ({
                      ...current,
                      document_type: value as typeof current.document_type,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Proposal">Proposal</SelectItem>
                    <SelectItem value="Report">Report</SelectItem>
                    <SelectItem value="Code">Code</SelectItem>
                    <SelectItem value="Presentation">Presentation</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.document_type ? (
                  <p className="text-sm text-destructive">{fieldErrors.document_type}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="student-document-file">File</Label>
                <Input
                  id="student-document-file"
                  type="file"
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      file: event.target.files?.[0] || null,
                    }))
                  }
                />
                {fieldErrors.file ? <p className="text-sm text-destructive">{fieldErrors.file}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="student-document-description">Submission note</Label>
                <Input
                  id="student-document-description"
                  value={formData.description}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </div>

              {apiError ? (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {apiError}
                </div>
              ) : null}

              <Button type="submit" className="rounded-xl" disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-sky-500/20 bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl">Submission history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="all" className="grid gap-6">
              <TabsList className="bg-background/80 border border-border/60 justify-start h-auto w-full flex-wrap p-1">
                <TabsTrigger value="all" className="flex-1 min-w-[120px]">
                  All Uploads
                  {documents.length > 0 && (
                    <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs">
                      {documents.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex-1 min-w-[120px]">
                  Pending
                  {documents.filter(d => d.review?.reviewStatus === "Pending review").length > 0 && (
                    <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-700">
                      {documents.filter(d => d.review?.reviewStatus === "Pending review").length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="evaluated" className="flex-1 min-w-[120px]">
                  Evaluated
                  {documents.filter(d => d.review?.reviewStatus !== "Pending review").length > 0 && (
                    <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-700">
                      {documents.filter(d => d.review?.reviewStatus !== "Pending review").length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-4">
                {documents.length ? (
                  documents.map((document) => <DocumentCard key={document.document_id} document={document} />)
                ) : (
                  <EmptyState message="No documents uploaded yet." />
                )}
              </TabsContent>

              <TabsContent value="pending" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-4">
                {documents.filter(d => d.review?.reviewStatus === "Pending review").length ? (
                  documents.filter(d => d.review?.reviewStatus === "Pending review").map((document) => <DocumentCard key={document.document_id} document={document} />)
                ) : (
                  <EmptyState message="No pending documents." />
                )}
              </TabsContent>

              <TabsContent value="evaluated" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-4">
                {documents.filter(d => d.review?.reviewStatus !== "Pending review").length ? (
                  documents.filter(d => d.review?.reviewStatus !== "Pending review").map((document) => <DocumentCard key={document.document_id} document={document} />)
                ) : (
                  <EmptyState message="No evaluated documents yet." />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </StudentPageShell>
  )
}

function DocumentCard({ document }: { document: DocumentRecord }) {
  const Icon = getDocumentIcon(document.document_type)

  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-lg">{document.document_name}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full">
                {document.document_type}
              </Badge>
              <Badge
                variant="outline"
                className={`rounded-full ${document.review?.reviewStatus === "Pending review" ? "border-amber-500/30 bg-amber-500/10 text-amber-700" : document.review?.reviewStatus === "Accepted" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700" : "border-rose-500/30 bg-rose-500/10 text-rose-700"}`}
              >
                {document.review?.reviewStatus || "Pending review"}
              </Badge>
              <span className="text-xs font-medium text-muted-foreground self-center">
                {formatSize(document.file_size)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            {document.uploaded_at ? new Date(document.uploaded_at).toLocaleDateString() : ""}
          </span>
          <Button asChild variant="outline" className="rounded-xl bg-background/70">
            <a href={`/api/projects/documents/${document.document_id}/download`}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </a>
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Submission note
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {document.review?.studentNote || "No note added."}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Faculty review
          </p>
          <div className="mt-2">
            <p className="text-sm leading-6 text-muted-foreground">
              {document.review?.reviewStatus !== "Pending review"
                ? document.review.reviewNote || "Reviewed without a note."
                : "Waiting for faculty review."}
            </p>
            {document.review?.reviewStatus !== "Pending review" ? (
              <p className="mt-3 text-xs font-medium text-muted-foreground">
                Reviewed by {document.review.reviewedBy || "Faculty"}
                {document.review.reviewedAt
                  ? ` on ${new Date(document.review.reviewedAt).toLocaleDateString()}`
                  : ""}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-background/70 p-8 text-center text-sm text-muted-foreground">
      <FileText className="mb-3 h-8 w-8 text-muted-foreground/50" />
      {message}
    </div>
  )
}

function getDocumentIcon(type: DocumentRecord["document_type"]) {
  switch (type) {
    case "Code":
      return FileCode2
    case "Presentation":
      return Presentation
    case "Other":
      return FolderOpen
    default:
      return FileText
  }
}

function formatSize(value?: string | null) {
  const parsed = Number(value || 0)
  if (!parsed) return "0 Bytes"

  const units = ["Bytes", "KB", "MB", "GB"]
  const unitIndex = Math.min(Math.floor(Math.log(parsed) / Math.log(1024)), units.length - 1)
  const size = parsed / 1024 ** unitIndex
  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`
}
