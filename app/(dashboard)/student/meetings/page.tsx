"use client"

import * as React from "react"
import { CalendarDays, Clock3, Loader2, MapPin, Search, UserRound } from "lucide-react"

import { StudentPageShell } from "@/components/student/student-page-shell"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Meeting = {
  project_meeting_id: number
  meeting_purpose?: string | null
  meeting_date_time: string
  meeting_location?: string | null
  meeting_notes?: string | null
  meeting_status?: string | null
  acd_staff?: { staff_name?: string | null } | null
  acd_project_meeting_attendance?: Array<{ is_present?: boolean | null }>
}

export default function StudentMeetingsPage() {
  const [meetings, setMeetings] = React.useState<Meeting[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const response = await fetch("/api/student/meetings")
        const result = await response.json()
        setMeetings(Array.isArray(result) ? result : [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchMeetings()
  }, [])

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-[28px] border border-border/60 bg-background/90">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    )
  }

  const filtered = meetings.filter((meeting) => {
    const query = searchQuery.toLowerCase()
    return (
      meeting.meeting_purpose?.toLowerCase().includes(query) ||
      meeting.acd_staff?.staff_name?.toLowerCase().includes(query)
    )
  })

  return (
    <StudentPageShell
      title="Meeting schedule"
      description="Track upcoming sessions, attendance state, and meeting notes from your project timeline."
      metrics={[
        {
          label: "Meetings",
          value: meetings.length,
          hint: "Total meeting records for your group.",
          tone: "sky",
        },
        {
          label: "Scheduled",
          value: meetings.filter((meeting) => meeting.meeting_status === "Scheduled").length,
          hint: "Sessions still ahead.",
          tone: "emerald",
        },
        {
          label: "Completed",
          value: meetings.filter((meeting) => meeting.meeting_status === "Completed").length,
          hint: "Closed discussions on record.",
          tone: "violet",
        },
      ]}
      action={
        <div className="relative min-w-[280px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by purpose or guide"
            className="h-11 rounded-xl bg-background/90 pl-9"
          />
        </div>
      }
    >
      <Tabs defaultValue="all" className="grid gap-6">
        <TabsList className="bg-background/80 border border-border/60 justify-start h-auto w-full flex-wrap p-1">
          <TabsTrigger value="all" className="flex-1 min-w-[120px]">
            All Meetings
            {filtered.length > 0 && (
              <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs">
                {filtered.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex-1 min-w-[120px]">
            Scheduled
            {filtered.filter(m => m.meeting_status === "Scheduled").length > 0 && (
              <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-700">
                {filtered.filter(m => m.meeting_status === "Scheduled").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 min-w-[120px]">
            Completed
            {filtered.filter(m => m.meeting_status === "Completed").length > 0 && (
              <span className="ml-2 rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-700">
                {filtered.filter(m => m.meeting_status === "Completed").length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-4">
          <div className="grid gap-5">
            {filtered.length ? (
              filtered.map((meeting) => <MeetingCard key={meeting.project_meeting_id} meeting={meeting} />)
            ) : (
              <EmptyState message="No meetings found." />
            )}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-4">
          <div className="grid gap-5">
            {filtered.filter(m => m.meeting_status === "Scheduled").length ? (
              filtered.filter(m => m.meeting_status === "Scheduled").map((meeting) => <MeetingCard key={meeting.project_meeting_id} meeting={meeting} />)
            ) : (
              <EmptyState message="No scheduled meetings found." />
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-4">
          <div className="grid gap-5">
            {filtered.filter(m => m.meeting_status === "Completed").length ? (
              filtered.filter(m => m.meeting_status === "Completed").map((meeting) => <MeetingCard key={meeting.project_meeting_id} meeting={meeting} />)
            ) : (
              <EmptyState message="No completed meetings found." />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </StudentPageShell>
  )
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  return (
    <Card className="rounded-[28px] border-sky-500/20 bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-xl">
            {meeting.meeting_purpose || "Scheduled meeting"}
          </CardTitle>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {new Date(meeting.meeting_date_time).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              {new Date(meeting.meeting_date_time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {meeting.meeting_location || "Location not set"}
            </span>
          </div>
        </div>
        <Badge variant="outline" className={`rounded-full ${meeting.meeting_status === "Scheduled" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700" : meeting.meeting_status === "Completed" ? "border-violet-500/30 bg-violet-500/10 text-violet-700" : ""}`}>
          {meeting.meeting_status || "Scheduled"}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Organized by
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm font-medium">
            <UserRound className="h-4 w-4 text-primary" />
            {meeting.acd_staff?.staff_name || "Guide not assigned"}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Attendance
          </p>
          <p className="mt-3 text-sm font-medium">
            {meeting.acd_project_meeting_attendance?.[0]?.is_present
              ? "Present"
              : meeting.meeting_status === "Completed"
                ? "Absent"
                : "Pending"}
          </p>
        </div>
        {meeting.meeting_notes ? (
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4 md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Notes
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {meeting.meeting_notes}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="rounded-[28px] border-violet-500/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
      <CardContent className="flex flex-col items-center justify-center p-8 text-center text-sm text-muted-foreground">
        <CalendarDays className="mb-3 h-8 w-8 text-muted-foreground/50" />
        {message}
      </CardContent>
    </Card>
  )
}
