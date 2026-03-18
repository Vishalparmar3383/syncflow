"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, CalendarRange, ClipboardCheck, FolderKanban, GraduationCap, Loader2 } from "lucide-react"

import { FacultyPageShell } from "@/components/faculty/faculty-page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type FacultyDashboardData = {
  staff: {
    staff_name: string
    designation?: string | null
    acd_department?: { department_name?: string | null } | null
  }
  stats: {
    totalGroups: number
    pendingProposals: number
    upcomingMeetings: number
  }
  recentGroups: Array<{
    project_group_id: number
    project_group_name: string
    project_title: string
    approval_status?: string | null
    acd_project_type?: { project_type_name?: string | null } | null
  }>
  upcomingMeetingsList: Array<{
    project_meeting_id: number
    meeting_purpose?: string | null
    meeting_date_time: string
    acd_project_group?: { project_group_name?: string | null } | null
  }>
}

export default function FacultyDashboardPage() {
  const [data, setData] = React.useState<FacultyDashboardData | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch("/api/faculty/dashboard")
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

  const staff = data?.staff
  const stats = data?.stats

  return (
    <FacultyPageShell
      title={`Welcome, ${staff?.staff_name || "Faculty"}`}
      description={`${staff?.designation || "Faculty member"} · ${staff?.acd_department?.department_name || "Department not set"}`}
      metrics={[
        {
          label: "Assigned groups",
          value: stats?.totalGroups || 0,
          hint: "Projects linked to your supervision roles.",
          tone: "sky",
        },
        {
          label: "Pending proposals",
          value: stats?.pendingProposals || 0,
          hint: "Teams waiting for your decision.",
          tone: "amber",
        },
        {
          label: "Upcoming meetings",
          value: stats?.upcomingMeetings || 0,
          hint: "Scheduled guide meetings ahead.",
          tone: "emerald",
        },
        {
          label: "Recent groups",
          value: data?.recentGroups?.length || 0,
          hint: "Most recent group activity in your scope.",
          tone: "violet",
        },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[28px] border-sky-500/20 bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">
                Current groups
              </p>
              <CardTitle className="mt-2 text-2xl">Recent project assignments</CardTitle>
            </div>
            <Button asChild variant="outline" className="rounded-xl bg-background/70">
              <Link href="/faculty/groups">
                Open groups
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {(data?.recentGroups || []).map((group) => (
              <div
                key={group.project_group_id}
                className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/70 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold">{group.project_group_name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{group.project_title}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="rounded-full">
                    {group.acd_project_type?.project_type_name || "General"}
                  </Badge>
                  <Badge className="rounded-full bg-emerald-600">
                    {group.approval_status || "Pending"}
                  </Badge>
                </div>
              </div>
            ))}
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
            <CalendarRange className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent className="space-y-4">
            {(data?.upcomingMeetingsList || []).length ? (
              data?.upcomingMeetingsList.map((meeting) => (
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
                    {meeting.acd_project_group?.project_group_name || "Group not available"}
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QuickLink
          href="/faculty/proposals"
          title="Proposals"
          hint="Review and approve pending submissions"
          icon={<ClipboardCheck className="h-5 w-5 text-amber-700" />}
          tone="amber"
        />
        <QuickLink
          href="/faculty/meetings"
          title="Meetings"
          hint="Manage project meetings and attendance"
          icon={<CalendarRange className="h-5 w-5 text-emerald-700" />}
          tone="emerald"
        />
        <QuickLink
          href="/faculty/documents"
          title="Documents"
          hint="Review uploaded files and add feedback"
          icon={<FolderKanban className="h-5 w-5 text-sky-700" />}
          tone="sky"
        />
        <QuickLink
          href="/faculty/evaluations"
          title="Evaluations"
          hint="Record outcomes and review assessment history"
          icon={<GraduationCap className="h-5 w-5 text-violet-700" />}
          tone="violet"
        />
      </div>
    </FacultyPageShell>
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
  tone: "amber" | "emerald" | "sky" | "violet"
}) {
  const toneClass = {
    amber:
      "border-amber-500/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(255,255,255,0))]",
    emerald:
      "border-emerald-500/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(255,255,255,0))]",
    sky:
      "border-sky-500/20 bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(255,255,255,0))]",
    violet:
      "border-violet-500/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.08),rgba(255,255,255,0))]",
  }[tone]

  return <Link href={href} className={`rounded-[24px] border p-5 transition-colors hover:border-primary/30 ${toneClass}`}>{icon}<h3 className="mt-4 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{hint}</p></Link>
}
