"use client"

import * as React from "react"
import { GraduationCap, Loader2, ShieldCheck, Target, UserRound, Users } from "lucide-react"

import { StudentPageShell } from "@/components/student/student-page-shell"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getApiUrl } from "@/lib/api"

type Member = {
  project_group_member_id: number
  is_group_leader?: boolean | null
  acd_student: {
    student_name: string
    email: string
    phone?: string | null
    enrollment_number: string
    cgpa?: string | number | null
  }
}

type GroupData = {
  group?: {
    project_group_id: number
    project_group_name: string
    project_title: string
    project_description?: string | null
    group_status?: string | null
    average_cpi?: string | number | null
    acd_project_type?: { project_type_name?: string | null } | null
    acd_staff_acd_project_group_guide_staff_idToacd_staff?: {
      staff_name?: string | null
    } | null
    acd_staff_acd_project_group_convener_staff_idToacd_staff?: {
      staff_name?: string | null
    } | null
    acd_staff_acd_project_group_expert_staff_idToacd_staff?: {
      staff_name?: string | null
    } | null
    acd_project_group_member?: Member[]
    progress?: number
  } | null
  projects?: Array<{
    project_group_id: number
    project_group_name: string
    project_title: string
    group_status?: string | null
    approval_status?: string | null
    progress: number
    acd_project_type?: { project_type_name?: string | null } | null
  }>
}

export default function StudentGroupPage() {
  const [data, setData] = React.useState<GroupData | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch(getApiUrl("/api/student/dashboard"))
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-[28px] border border-border/60 bg-background/90">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    )
  }

  const group = data?.group
  const projects = data?.projects || []

  if (!group) {
    return (
      <StudentPageShell
        title="My group"
        description="You will see your team, guide, and member details here once a project group is active."
      >
        <Card className="rounded-[28px] border-violet-500/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
          <CardContent className="p-8 text-sm text-muted-foreground">
            No group is assigned yet.
          </CardContent>
        </Card>
      </StudentPageShell>
    )
  }

  return (
    <StudentPageShell
      title="My group"
      description="Review your project team, supervising staff, and academic profile in one place."
      metrics={[
        {
          label: "Group",
          value: group.project_group_name,
          hint: "Current team identifier.",
          tone: "violet",
        },
        {
          label: "Status",
          value: group.group_status || "Active",
          hint: "Current operating state.",
          tone: "emerald",
        },
        {
          label: "Type",
          value: group.acd_project_type?.project_type_name || "Not set",
          hint: "Project classification.",
          tone: "sky",
        },
        {
          label: "Average CPI",
          value: Number(group.average_cpi || 0).toFixed(2),
          hint: "Group academic profile.",
          tone: "amber",
        },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[28px] border-violet-500/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl">{group.project_title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm leading-6 text-muted-foreground">
              {group.project_description || "No project description provided yet."}
            </p>
            <Badge className="rounded-full bg-emerald-600">{group.group_status || "Active"}</Badge>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-sky-500/20 bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl">Staff assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AssignmentRow label="Guide" value={group.acd_staff_acd_project_group_guide_staff_idToacd_staff?.staff_name || "Not assigned"} />
            <AssignmentRow label="Convener" value={group.acd_staff_acd_project_group_convener_staff_idToacd_staff?.staff_name || "Not assigned"} />
            <AssignmentRow label="Expert" value={group.acd_staff_acd_project_group_expert_staff_idToacd_staff?.staff_name || "Not assigned"} />
            <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      Progress
                    </p>
                    <p className="mt-1 text-sm font-medium">{group.progress || 0}% complete</p>
                  </div>
                </div>
              </div>
              <Progress value={group.progress || 0} className="mt-4 h-3 bg-sky-500/12" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[28px] border-sky-500/20 bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl">All project memberships</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {projects.map((project) => (
            <div key={project.project_group_id} className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">{project.project_title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {project.project_group_name} · {project.acd_project_type?.project_type_name || "General"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-full bg-background/70">
                    {project.approval_status || "Pending"}
                  </Badge>
                  <Badge variant="outline" className="rounded-full bg-background/70">
                    {project.group_status || "Active"}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-3 bg-sky-500/12" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-amber-500/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Users className="h-5 w-5 text-amber-600" />
            Team members
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(group.acd_project_group_member || []).map((member) => (
            <div
              key={member.project_group_member_id}
              className="rounded-2xl border border-border/60 bg-background/70 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{member.acd_student.student_name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {member.acd_student.enrollment_number}
                  </p>
                </div>
                {member.is_group_leader ? (
                  <Badge className="rounded-full bg-amber-600">Leader</Badge>
                ) : null}
              </div>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div>{member.acd_student.email}</div>
                <div>{member.acd_student.phone || "No phone on file"}</div>
                <div className="flex items-center gap-2 text-foreground">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  CGPA {Number(member.acd_student.cgpa || 0).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </StudentPageShell>
  )
}

function AssignmentRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
      <div className="rounded-xl bg-primary/10 p-2 text-primary">
        {label === "Guide" ? <ShieldCheck className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}
