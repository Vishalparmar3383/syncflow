"use client"

import * as React from "react"
import { Award, CheckCircle2, Clock3, Loader2, Send } from "lucide-react"

import { StudentPageShell } from "@/components/student/student-page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { getApiUrl } from "@/lib/api"

type Project = {
  project_group_id: number
  project_group_name: string
  project_title: string
  approval_status?: string | null
  group_status?: string | null
  progress: number
  membership?: {
    is_group_leader?: boolean
  }
  acd_project_type?: { project_type_name?: string | null } | null
  acd_project_evaluation?: Array<{
    evaluation_id: number
    evaluation_status?: string | null
    remarks?: string | null
    total_marks?: string | number | null
  }>
}

type DashboardData = {
  projects?: Project[]
}

export default function StudentEvaluationsPage() {
  const [data, setData] = React.useState<DashboardData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [submittingFor, setSubmittingFor] = React.useState<number | null>(null)
  const [notes, setNotes] = React.useState<Record<number, string>>({})
  const [apiError, setApiError] = React.useState<string | null>(null)

  const loadDashboard = React.useCallback(async () => {
    try {
      const response = await fetch(getApiUrl("/api/student/dashboard"))
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const requestEvaluation = async (projectGroupId: number) => {
    setApiError(null)
    setSubmittingFor(projectGroupId)

    try {
      const response = await fetch(getApiUrl("/api/student/evaluations/request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_group_id: projectGroupId,
          remarks: notes[projectGroupId] || "",
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        setApiError(result.error || "Failed to request evaluation.")
        setSubmittingFor(null)
        return
      }

      await loadDashboard()
      setSubmittingFor(null)
    } catch (error) {
      console.error(error)
      setApiError("Failed to request evaluation.")
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

  const projects = data?.projects || []

  return (
    <StudentPageShell
      title="Evaluations"
      description="Request evaluations after approval and track progress updates entered by faculty for each project."
      metrics={[
        {
          label: "Projects",
          value: projects.length,
          hint: "Project memberships currently visible to you.",
          tone: "sky",
        },
        {
          label: "Pending requests",
          value: projects.filter((project) => project.acd_project_evaluation?.some((evaluation) => evaluation.evaluation_status === "Pending")).length,
          hint: "Evaluation requests waiting for faculty action.",
          tone: "amber",
        },
        {
          label: "Completed",
          value: projects.filter((project) => project.acd_project_evaluation?.some((evaluation) => evaluation.evaluation_status === "Completed")).length,
          hint: "Projects already evaluated.",
          tone: "emerald",
        },
      ]}
    >
      <Tabs defaultValue="all" className="grid gap-6">
        <TabsList className="bg-background/80 border border-border/60 justify-start h-auto w-full flex-wrap p-1">
          <TabsTrigger value="all" className="flex-1 min-w-[120px]">All Projects</TabsTrigger>
          <TabsTrigger value="pending" className="flex-1 min-w-[120px]">
            Pending
            {projects.filter(p => p.acd_project_evaluation?.some(e => e.evaluation_status === "Pending")).length > 0 && (
              <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-700">
                {projects.filter(p => p.acd_project_evaluation?.some(e => e.evaluation_status === "Pending")).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 min-w-[120px]">
            Completed
            {projects.filter(p => p.acd_project_evaluation?.some(e => e.evaluation_status === "Completed")).length > 0 && (
              <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-700">
                {projects.filter(p => p.acd_project_evaluation?.some(e => e.evaluation_status === "Completed")).length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid gap-6">
            {projects.length ? (
              projects.map(project => <ProjectCard key={project.project_group_id} project={project} />)
            ) : (
              <EmptyState message="You are not part of any project groups yet." />
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid gap-6">
            {projects.filter(p => p.acd_project_evaluation?.some(e => e.evaluation_status === "Pending")).length ? (
              projects.filter(p => p.acd_project_evaluation?.some(e => e.evaluation_status === "Pending"))
                .map(project => <ProjectCard key={project.project_group_id} project={project} />)
            ) : (
              <EmptyState message="No pending evaluation requests." />
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid gap-6">
            {projects.filter(p => p.acd_project_evaluation?.some(e => e.evaluation_status === "Completed")).length ? (
              projects.filter(p => p.acd_project_evaluation?.some(e => e.evaluation_status === "Completed"))
                .map(project => <ProjectCard key={project.project_group_id} project={project} />)
            ) : (
              <EmptyState message="No completed evaluations yet." />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </StudentPageShell>
  )

  function ProjectCard({ project }: { project: Project }) {
    const pendingEvaluation = project.acd_project_evaluation?.find((evaluation) => evaluation.evaluation_status === "Pending")
    const completedEvaluation = project.acd_project_evaluation?.find((evaluation) => evaluation.evaluation_status === "Completed")
    const canRequest =
      project.membership?.is_group_leader &&
      project.approval_status === "Approved" &&
      !pendingEvaluation

    return (
      <Card
        className="rounded-[28px] border-amber-500/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none"
      >
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Award className="h-5 w-5 text-amber-600" />
              {project.project_title}
            </CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              {project.project_group_name} · {project.acd_project_type?.project_type_name || "General"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-full">
              {project.approval_status || "Pending"}
            </Badge>
            {project.membership?.is_group_leader ? (
              <Badge className="rounded-full bg-primary">Leader</Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Faculty-updated progress</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-3 bg-amber-500/12" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Evaluation request</p>
              <div className="mt-3">
                {pendingEvaluation ? (
                  <Badge variant="outline" className="rounded-full">
                    <Clock3 className="mr-1 h-3 w-3" />
                    Pending faculty review
                  </Badge>
                ) : completedEvaluation ? (
                  <Badge className="rounded-full bg-emerald-600">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Completed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="rounded-full">Not requested</Badge>
                )}
              </div>
              {completedEvaluation ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Request average: {completedEvaluation.total_marks || "0.00"}%<br />
                  {completedEvaluation.remarks || "No remarks recorded."}
                </p>
              ) : null}
            </div>

            {project.progress < 100 ? (
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Leader action</p>
                <div className="mt-3 space-y-3">
                  <Textarea
                    className="min-h-24 resize-none"
                    placeholder="Optional note for the faculty evaluator"
                    value={notes[project.project_group_id] || ""}
                    onChange={(event) =>
                      setNotes((current) => ({
                        ...current,
                        [project.project_group_id]: event.target.value,
                      }))
                    }
                    disabled={!canRequest}
                  />
                  <Button
                    onClick={() => requestEvaluation(project.project_group_id)}
                    disabled={!canRequest || submittingFor === project.project_group_id}
                    className="rounded-xl"
                  >
                    {submittingFor === project.project_group_id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Request evaluation
                  </Button>
                  {!project.membership?.is_group_leader ? (
                    <p className="text-xs text-muted-foreground">Only the group leader can request evaluations.</p>
                  ) : null}
                  {project.approval_status !== "Approved" ? (
                    <p className="text-xs text-muted-foreground">Proposal approval is required before requesting evaluation.</p>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-background/70 p-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mb-2" />
                <p className="font-semibold text-emerald-700">Project Completed</p>
                <p className="text-sm text-muted-foreground mt-1">This project has reached 100% progress.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="rounded-[28px] border-violet-500/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
      <CardContent className="flex items-center gap-4 p-8 text-sm text-muted-foreground">
        <Clock3 className="h-5 w-5 text-primary" />
        {message}
      </CardContent>
    </Card>
  )
}
