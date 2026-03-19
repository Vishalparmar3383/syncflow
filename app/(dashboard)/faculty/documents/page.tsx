"use client"

import * as React from "react"
import { Download, FileText, Loader2 } from "lucide-react"

import { FacultyPageShell } from "@/components/faculty/faculty-page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { getApiUrl } from "@/lib/api"

type Group = {
  project_group_id: number
  project_group_name: string
  project_title: string
}

type DocumentRecord = {
  document_id: number
  document_name: string
  document_type: "Proposal" | "Report" | "Code" | "Presentation" | "Other"
  document_path?: string | null
  uploaded_at?: string | null
  review?: {
    studentNote?: string
    reviewStatus?: "Pending review" | "Accepted" | "Rejected"
    reviewNote?: string
    reviewedBy?: string
    reviewedAt?: string
  }
}

export default function FacultyDocumentsPage() {
  const [groups, setGroups] = React.useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = React.useState("")
  const [documents, setDocuments] = React.useState<DocumentRecord[]>([])
  const [selectedDocument, setSelectedDocument] = React.useState<DocumentRecord | null>(null)
  const [decision, setDecision] = React.useState<"Accepted" | "Rejected">("Accepted")
  const [reviewNote, setReviewNote] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [submittingFor, setSubmittingFor] = React.useState<number | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const fetchDocuments = React.useCallback(async (groupId: number) => {
    const response = await fetch(getApiUrl(`/api/projects/documents?group_id=${groupId}`))
    const result = await response.json()
    setDocuments(Array.isArray(result) ? result : [])
  }, [])

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const groupsResponse = await fetch(getApiUrl("/api/groups"))
        const groupsResult = await groupsResponse.json()
        const nextGroups = Array.isArray(groupsResult) ? groupsResult : []
        setGroups(nextGroups)

        if (nextGroups.length) {
          const firstGroupId = String(nextGroups[0].project_group_id)
          setSelectedGroupId(firstGroupId)
          await fetchDocuments(nextGroups[0].project_group_id)
        }
      } catch (fetchError) {
        console.error(fetchError)
        setError("Failed to load group documents.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [fetchDocuments])

  const handleGroupChange = async (value: string) => {
    setSelectedGroupId(value)
    setError(null)
    await fetchDocuments(Number(value))
  }

  const openActionDialog = (document: DocumentRecord) => {
    setSelectedDocument(document)
    setDecision("Accepted")
    setReviewNote("")
    setError(null)
  }

  const closeActionDialog = () => {
    setSelectedDocument(null)
    setReviewNote("")
    setDecision("Accepted")
    setError(null)
  }

  const submitReview = async () => {
    if (!selectedDocument) return

    const note = reviewNote.trim()
    if (note.length < 2) {
      setError("Please add a review note (at least 2 characters).")
      return
    }

    setError(null)
    setSubmittingFor(selectedDocument.document_id)
    try {
      const response = await fetch(getApiUrl(`/api/projects/documents/${selectedDocument.document_id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, review_note: note }),
      })

      const result = await response.json()
      if (!response.ok) {
        setError(result.error || "Failed to review document.")
        setSubmittingFor(null)
        return
      }

      if (selectedGroupId) {
        await fetchDocuments(Number(selectedGroupId))
      }
      setSubmittingFor(null)
      closeActionDialog()
    } catch (submitError) {
      console.error(submitError)
      setError("Failed to review document.")
      setSubmittingFor(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-[28px] border border-border/60 bg-background/90">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    )
  }

  const pendingDocuments = documents.filter(
    (document) => (document.review?.reviewStatus || "Pending review") === "Pending review"
  )
  const evaluatedDocuments = documents.filter(
    (document) => (document.review?.reviewStatus || "Pending review") !== "Pending review"
  )

  return (
    <FacultyPageShell
      title="Document reviews"
      description="Review student uploads with accept/reject decisions and feedback."
      metrics={[
        {
          label: "Groups",
          value: groups.length,
          hint: "Groups available for your faculty role.",
          tone: "sky",
        },
        {
          label: "Pending review",
          value: pendingDocuments.length,
          hint: "Uploads waiting for your review.",
          tone: "amber",
        },
        {
          label: "Evaluated",
          value: evaluatedDocuments.length,
          hint: "Uploads already accepted or rejected.",
          tone: "emerald",
        },
      ]}
    >
      <Dialog open={Boolean(selectedDocument)} onOpenChange={(open) => (!open ? closeActionDialog() : null)}>
        <DialogContent className="rounded-[24px]">
          <DialogHeader>
            <DialogTitle>Review document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
              <p className="font-medium">{selectedDocument?.document_name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedDocument?.review?.studentNote || "No student note provided."}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Decision</Label>
              <Select value={decision} onValueChange={(value) => setDecision(value as "Accepted" | "Rejected")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Accepted">Accept</SelectItem>
                  <SelectItem value="Rejected">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Feedback</Label>
              <Textarea
                className="min-h-24 resize-none"
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                placeholder="Write feedback for this document"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeActionDialog}>
              Cancel
            </Button>
            <Button onClick={submitReview} disabled={submittingFor === selectedDocument?.document_id}>
              {submittingFor === selectedDocument?.document_id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Submit decision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6">
        <Card className="rounded-[28px] border-sky-500/20 bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
          <CardContent className="p-6">
            <div className="space-y-2">
              <Label>Project group</Label>
              <Select value={selectedGroupId} onValueChange={handleGroupChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.project_group_id} value={String(group.project_group_id)}>
                      {group.project_group_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <Tabs defaultValue="pending" className="grid gap-6">
          <TabsList className="bg-background/80 border border-border/60 justify-start h-auto w-full flex-wrap p-1">
            <TabsTrigger value="pending" className="flex-1 min-w-[120px]">
              Pending
              {pendingDocuments.length > 0 && (
                <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-700">
                  {pendingDocuments.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="evaluated" className="flex-1 min-w-[120px]">
              Evaluated
              {evaluatedDocuments.length > 0 && (
                <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-700">
                  {evaluatedDocuments.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-4">
            {pendingDocuments.length ? (
              pendingDocuments.map((document) => (
                <DocumentListItem
                  key={document.document_id}
                  document={document}
                  actionLabel="Review document"
                  action={() => openActionDialog(document)}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-background/70 p-8 text-center text-sm text-muted-foreground">
                <FileText className="mb-3 h-8 w-8 text-muted-foreground/50" />
                No pending documents to review.
              </div>
            )}
          </TabsContent>

          <TabsContent value="evaluated" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-4">
            {evaluatedDocuments.length ? (
              evaluatedDocuments.map((document) => (
                <DocumentListItem
                  key={document.document_id}
                  document={document}
                  actionLabel="Update decision"
                  action={() => openActionDialog(document)}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-background/70 p-8 text-center text-sm text-muted-foreground">
                <FileText className="mb-3 h-8 w-8 text-muted-foreground/50" />
                No evaluated documents yet.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </FacultyPageShell>
  )
}

function DocumentListItem({
  document,
  actionLabel,
  action,
}: {
  document: DocumentRecord
  actionLabel: string
  action: () => void
}) {
  const status = document.review?.reviewStatus || "Pending review"

  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium">{document.document_name}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-full">
              {document.document_type}
            </Badge>
            <Badge
              variant="outline"
              className={`rounded-full ${status === "Pending review" ? "border-amber-500/30 bg-amber-500/10 text-amber-700" : status === "Accepted" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700" : "border-rose-500/30 bg-rose-500/10 text-rose-700"}`}
            >
              {status}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {document.review?.studentNote || "No student note provided."}
          </p>
          {status !== "Pending review" ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {document.review?.reviewNote || "No feedback."} | {document.review?.reviewedBy || "Faculty"}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl bg-background/70" asChild>
            <a href={getApiUrl(`/api/projects/documents/${document.document_id}/download`)}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </a>
          </Button>
          <Button onClick={action} className="rounded-xl">
            <FileText className="mr-2 h-4 w-4" />
            {actionLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
