"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  Loader2,
  Target,
  Users,
} from "lucide-react"

import { StudentPageShell } from "@/components/student/student-page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getApiUrl } from "@/lib/api"

type StudentDashboardData = {
  student?: {
    student_name: string
    cgpa?: string | number | null
    acd_department?: { department_name?: string | null } | null
    acd_academic_year?: { academic_year_code?: string | null } | null
  } | null
  group?: {
    project_group_id: number
    project_group_name: string
    project_title: string
    project_description?: string | null
    group_status?: string | null
    approval_status?: string | null
    acd_project_type?: { project_type_name?: string | null } | null
    acd_staff_acd_project_group_guide_staff_idToacd_staff?: {
      staff_name?: string | null
    } | null
    acd_project_group_member?: Array<{ project_group_member_id: number }>
  } | null
  upcomingMeetings?: Array<{
    project_meeting_id: number
    meeting_purpose?: string | null
    meeting_date_time: string
    meeting_location?: string | null
  }>
  projects?: Array<{
    project_group_id: number
    project_group_name: string
    project_title: string
    group_status?: string | null
    approval_status?: string | null
    progress: number
    acd_project_type?: { project_type_name?: string | null } | null
    acd_staff_acd_project_group_guide_staff_idToacd_staff?: {
      staff_name?: string | null
    } | null
    acd_project_group_member?: Array<{ project_group_member_id: number }>
  }>
}

export default function StudentDashboardPage() {
  const [data, setData] = React.useState<StudentDashboardData | null>(null)
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

  const student = data?.student
  const group = data?.group
  const projects = data?.projects || []
  const upcomingMeetings = data?.upcomingMeetings || []

  return (
    <StudentPageShell
      title={`Welcome, ${student?.student_name || "Student"}`}
      description={`${student?.acd_department?.department_name || "Department not set"} · ${student?.acd_academic_year?.academic_year_code || "Academic year not set"}`}
      metrics={[
        {
          label: "Group status",
          value: group?.group_status || "No active group",
          hint: "Current operating state of the selected active project.",
          tone: "sky",
        },
        {
          label: "Approval",
          value: group?.approval_status || "Pending",
          hint: "Guide or admin decision on your proposal.",
          tone: "emerald",
        },
        {
          label: "Projects",
          value: projects.length,
          hint: "Project memberships currently assigned to you.",
          tone: "sky",
        },
        {
          label: "Upcoming meetings",
          value: upcomingMeetings.length,
          hint: "Scheduled discussions ahead.",
          tone: "violet",
        },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[28px] border-sky-500/20 bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">
                Project overview
              </p>
              <CardTitle className="mt-2 text-2xl">
                {group?.project_title || "No active project yet"}
              </CardTitle>
            </div>
            {group ? (
              <Badge variant="outline" className="rounded-full bg-background/70">
                {group.acd_project_type?.project_type_name || "General"}
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-5">
            {group ? (
              <>
                <p className="text-sm leading-6 text-muted-foreground">
                  {group.project_description || "No project description added yet."}
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  <InfoCard
                    title="Group"
                    value={group.project_group_name}
                    hint={`${group.acd_project_group_member?.length || 0} members`}
                  />
                  <InfoCard
                    title="Guide"
                    value={
                      group.acd_staff_acd_project_group_guide_staff_idToacd_staff?.staff_name ||
                      "Unassigned"
                    }
                    hint="Current supervising faculty"
                  />
                  <InfoCard
                    title="Approval"
                    value={group.approval_status || "Pending"}
                    hint="Current decision state"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild className="rounded-xl">
                    <Link href="/student/group">
                      Open group
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl bg-background/70">
                    <Link href="/student/documents">Manage documents</Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-5">
                <p className="text-sm leading-6 text-muted-foreground">
                  You are not part of a project group yet. Start by submitting a proposal and selecting a guide.
                </p>
                <Button asChild className="rounded-xl">
                  <Link href="/student/proposals">
                    Start proposal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-emerald-500/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
                Schedule
              </p>
              <CardTitle className="mt-2 text-2xl">Upcoming meetings</CardTitle>
            </div>
            <CalendarDays className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingMeetings.length ? (
              upcomingMeetings.map((meeting) => (
                <div
                  key={meeting.project_meeting_id}
                  className="rounded-2xl border border-border/60 bg-background/70 p-4"
                >
                  <p className="font-medium">{meeting.meeting_purpose || "Scheduled meeting"}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {new Date(meeting.meeting_date_time).toLocaleDateString()} at{" "}
                    {new Date(meeting.meeting_date_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {meeting.meeting_location || "Location to be announced"}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
                No upcoming meetings scheduled.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[28px] border-violet-500/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-600">
              Portfolio progress
            </p>
            <CardTitle className="mt-2 text-2xl">Project completion</CardTitle>
          </div>
          <Target className="h-5 w-5 text-violet-600" />
        </CardHeader>
        <CardContent className="grid gap-4">
          {projects.length ? (
            projects.map((project) => (
              <div
                key={project.project_group_id}
                className="rounded-2xl border border-border/60 bg-background/70 p-4"
              >
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
                    <span className="text-muted-foreground">
                      Guide: {project.acd_staff_acd_project_group_guide_staff_idToacd_staff?.staff_name || "Unassigned"}
                    </span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-3 bg-violet-500/12" />
                  <p className="text-xs text-muted-foreground">
                    Progress is based on approval, guide assignment, documents, meetings, and evaluation records for this project.
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
              No project memberships found yet.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QuickLink
          href="/student/proposals"
          title="Proposal"
          hint="Create or review your project submission"
          icon={<CheckCircle2 className="h-5 w-5 text-sky-700" />}
          tone="sky"
        />
        <QuickLink
          href="/student/group"
          title="Group"
          hint="See members, guide, and team details"
          icon={<Users className="h-5 w-5 text-emerald-700" />}
          tone="emerald"
        />
        <QuickLink
          href="/student/meetings"
          title="Meetings"
          hint="Track attendance and scheduled sessions"
          icon={<CalendarDays className="h-5 w-5 text-violet-700" />}
          tone="violet"
        />
        <QuickLink
          href="/student/documents"
          title="Documents"
          hint="Upload reports, code, and presentations"
          icon={<FolderKanban className="h-5 w-5 text-amber-700" />}
          tone="amber"
        />
      </div>
    </StudentPageShell>
  )
}

function InfoCard({
  title,
  value,
  hint,
}: {
  title: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {title}
      </p>
      <p className="mt-2 text-base font-semibold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  )
}

function QuickLink({
  href,
  title,
  hint,
  icon,
  tone,
}: {
  href: string
  title: string
  hint: string
  icon: React.ReactNode
  tone: "sky" | "emerald" | "violet" | "amber"
}) {
  const toneClass = {
    sky: "border-sky-500/20 bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(255,255,255,0))]",
    emerald:
      "border-emerald-500/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(255,255,255,0))]",
    violet:
      "border-violet-500/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.08),rgba(255,255,255,0))]",
    amber:
      "border-amber-500/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(255,255,255,0))]",
  }[tone]

  return (
    <Link
      href={href}
      className={`rounded-[24px] border p-5 shadow-none transition-colors hover:border-primary/30 ${toneClass}`}
    >
      {icon}
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{hint}</p>
    </Link>
  )
}
