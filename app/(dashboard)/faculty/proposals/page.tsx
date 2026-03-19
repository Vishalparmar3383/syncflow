"use client"

import * as React from "react"
import { z } from "zod"
import { CheckCircle2, Inbox, Loader2, MessageSquare, XCircle } from "lucide-react"

import { FacultyPageShell } from "@/components/faculty/faculty-page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { getApiUrl } from "@/lib/api"

type Proposal = {
  project_group_id: number
  project_group_name: string
  project_title: string
  project_description?: string | null
  project_area?: string | null
  acd_project_type: { project_type_name: string }
  acd_academic_year: { academic_year_code: string }
  acd_project_group_member: Array<{
    student_id: number
    is_group_leader?: boolean | null
    acd_student: {
      student_name: string
      enrollment_number: string
    }
  }>
  approval_status: "Pending" | "Approved" | "Rejected"
}

const proposalDecisionSchema = z.object({
  description: z.string().trim().max(1000).optional(),
})

export default function FacultyProposalsPage() {
  const [proposals, setProposals] = React.useState<Proposal[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedProposal, setSelectedProposal] = React.useState<Proposal | null>(null)
  const [actionType, setActionType] = React.useState<"Approved" | "Rejected" | null>(null)
  const [feedback, setFeedback] = React.useState("")
  const [processing, setProcessing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const fetchProposals = React.useCallback(async () => {
    try {
      const response = await fetch(getApiUrl("/api/faculty/proposals"))
      const result = await response.json()
      setProposals(Array.isArray(result) ? result : [])
    } catch (fetchError) {
      console.error(fetchError)
      setError("Failed to load proposals.")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

  const handleDecision = async () => {
    if (!selectedProposal || !actionType) return

    const parsed = proposalDecisionSchema.safeParse({
      description: feedback || undefined,
    })

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid feedback.")
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const response = await fetch(getApiUrl(`/api/faculty/proposals/${selectedProposal.project_group_id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: actionType,
          description: parsed.data.description || "",
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        setError(result.error || "Failed to update proposal.")
        setProcessing(false)
        return
      }

      setProposals((current) =>
        current.filter((proposal) => proposal.project_group_id !== selectedProposal.project_group_id)
      )
      setSelectedProposal(null)
      setActionType(null)
      setFeedback("")
      setProcessing(false)
    } catch (decisionError) {
      console.error(decisionError)
      setError("Failed to update proposal.")
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-[28px] border border-border/60 bg-background/90">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <FacultyPageShell
      title="Pending proposals"
      description="Review project submissions waiting for guide approval and give teams a clear decision path."
      metrics={[
        {
          label: "Pending",
          value: proposals.length,
          hint: "Proposals requiring your action.",
          tone: "amber",
        },
      ]}
    >
      <div className="grid gap-5">
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="bg-background/80 border border-border/60">
          <TabsTrigger value="pending">
            Pending
            {proposals.filter(p => p.approval_status === "Pending").length > 0 && (
              <Badge variant="secondary" className="ml-2 rounded-full px-1.5 py-0.5 text-xs">
                {proposals.filter(p => p.approval_status === "Pending").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid gap-5">
            {proposals.filter(p => p.approval_status === "Pending").length ? (
              proposals.filter(p => p.approval_status === "Pending").map((proposal) => (
                <ProposalCard 
                  key={proposal.project_group_id} 
                  proposal={proposal} 
                  onAction={(type) => {
                    setSelectedProposal(proposal)
                    setActionType(type)
                  }} 
                />
              ))
            ) : (
              <EmptyState message="No pending proposals right now." />
            )}
          </div>
        </TabsContent>

        <TabsContent value="approved" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid gap-5">
            {proposals.filter(p => p.approval_status === "Approved").length ? (
              proposals.filter(p => p.approval_status === "Approved").map((proposal) => (
                <ProposalCard key={proposal.project_group_id} proposal={proposal} />
              ))
            ) : (
              <EmptyState message="No approved proposals." />
            )}
          </div>
        </TabsContent>

        <TabsContent value="rejected" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid gap-5">
            {proposals.filter(p => p.approval_status === "Rejected").length ? (
              proposals.filter(p => p.approval_status === "Rejected").map((proposal) => (
                <ProposalCard key={proposal.project_group_id} proposal={proposal} />
              ))
            ) : (
              <EmptyState message="No rejected proposals." />
            )}
          </div>
        </TabsContent>

      </Tabs>

        <Dialog open={Boolean(selectedProposal)} onOpenChange={() => setSelectedProposal(null)}>
          <DialogContent className="rounded-[28px]">
            <DialogHeader>
              <DialogTitle>
                {actionType} {selectedProposal?.project_group_name}
              </DialogTitle>
              <DialogDescription>
                Add optional feedback for the team before confirming this decision.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-4 w-4" />
                Feedback
              </div>
              <Textarea
                className="min-h-28 resize-none"
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedProposal(null)}>
                Cancel
              </Button>
              <Button onClick={handleDecision} disabled={processing}>
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : `Confirm ${actionType}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </FacultyPageShell>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="rounded-[28px] border-violet-500/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
      <CardContent className="flex items-center gap-4 p-8 text-sm text-muted-foreground">
        <Inbox className="h-5 w-5 text-primary" />
        {message}
      </CardContent>
    </Card>
  )
}

function ProposalCard({ 
  proposal, 
  onAction 
}: { 
  proposal: Proposal, 
  onAction?: (type: "Approved" | "Rejected") => void 
}) {
  return (
    <Card className="rounded-[28px] border-amber-500/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-2xl">{proposal.project_group_name}</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">{proposal.project_title}</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Badge variant="outline" className="rounded-full">
            {proposal.acd_project_type.project_type_name}
          </Badge>
          <Badge variant="outline" className="rounded-full">
            {proposal.acd_academic_year.academic_year_code}
          </Badge>
          {proposal.approval_status !== "Pending" && (
            <Badge className={`rounded-full ${proposal.approval_status === 'Approved' ? 'bg-emerald-600' : 'bg-destructive'}`}>
              {proposal.approval_status}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <p className="text-sm leading-6 text-muted-foreground">
            {proposal.project_description || "No description provided."}
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {proposal.project_area || "Area not specified"}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {proposal.acd_project_group_member.map((member) => (
            <div
              key={member.student_id}
              className="rounded-2xl border border-border/60 bg-background/70 p-4"
            >
              <p className="font-medium">{member.acd_student.student_name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {member.acd_student.enrollment_number}
              </p>
              {member.is_group_leader ? (
                <Badge className="mt-3 rounded-full bg-amber-600">Leader</Badge>
              ) : null}
            </div>
          ))}
        </div>

        {onAction && proposal.approval_status === "Pending" && (
          <div className="flex gap-3">
            <Button
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
              onClick={() => onAction("Approved")}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={() => onAction("Rejected")}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
