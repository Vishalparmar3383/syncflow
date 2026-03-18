"use client"

import * as React from "react"
import { ReactNode } from "react"
import { z } from "zod"
import { CheckSquare, Loader2, PlusCircle } from "lucide-react"

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
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Textarea } from "@/components/ui/textarea"

type MeetingAttendance = {
  project_meeting_attendance_id: number
  student_id: number
  is_present?: boolean | null
  attendance_remark?: "Present" | "Absent" | "Late" | "On_Leave" | "Excused" | null
  acd_student?: {
    student_name?: string | null
    enrollment_number?: string | null
  } | null
}

type Meeting = {
  project_meeting_id: number
  meeting_purpose?: string | null
  meeting_date_time: string
  meeting_location?: string | null
  meeting_status?: string | null
  meeting_notes?: string | null
  acd_project_group?: { project_group_name?: string | null } | null
  acd_project_meeting_attendance?: MeetingAttendance[]
}

type Group = {
  project_group_id: number
  project_group_name: string
}

type AttendanceDraft = {
  student_id: number
  is_present: boolean
  attendance_remark: "Present" | "Absent" | "Late" | "On_Leave" | "Excused"
}

const meetingFormSchema = z.object({
  project_group_id: z.string().min(1, "Project group is required."),
  meeting_date_time: z.string().min(1, "Meeting date and time is required."),
  meeting_purpose: z.string().trim().min(2, "Purpose is required."),
  meeting_location: z.string().trim().min(2, "Location is required."),
})

export default function FacultyMeetingsPage() {
  const [meetings, setMeetings] = React.useState<Meeting[]>([])
  const [groups, setGroups] = React.useState<Group[]>([])
  const [loading, setLoading] = React.useState(true)
  const [openSchedule, setOpenSchedule] = React.useState(false)
  const [attendanceMeetingId, setAttendanceMeetingId] = React.useState<number | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [apiError, setApiError] = React.useState<string | null>(null)
  const [meetingNotes, setMeetingNotes] = React.useState("")
  const [attendanceDrafts, setAttendanceDrafts] = React.useState<Record<number, AttendanceDraft>>({})
  const [formData, setFormData] = React.useState({
    project_group_id: "",
    meeting_date_time: "",
    meeting_purpose: "",
    meeting_location: "",
  })

  const loadData = React.useCallback(async () => {
    try {
      const [meetingsResponse, groupsResponse] = await Promise.all([
        fetch("/api/faculty/meetings"),
        fetch("/api/groups"),
      ])

      const [meetingsResult, groupsResult] = await Promise.all([
        meetingsResponse.json(),
        groupsResponse.json(),
      ])

      setMeetings(Array.isArray(meetingsResult) ? meetingsResult : [])
      setGroups(Array.isArray(groupsResult) ? groupsResult : [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const scheduledMeetings = meetings.filter((meeting) => meeting.meeting_status === "Scheduled")
  const completedMeetings = meetings.filter((meeting) => meeting.meeting_status === "Completed")
  const activeMeeting =
    meetings.find((meeting) => meeting.project_meeting_id === attendanceMeetingId) || null

  const openAttendanceDialog = (meeting: Meeting) => {
    const nextDrafts = Object.fromEntries(
      (meeting.acd_project_meeting_attendance || []).map((attendance) => [
        attendance.student_id,
        {
          student_id: attendance.student_id,
          is_present: Boolean(attendance.is_present),
          attendance_remark: attendance.attendance_remark || "Absent",
        },
      ])
    )

    setAttendanceDrafts(nextDrafts)
    setMeetingNotes(meeting.meeting_notes || "")
    setApiError(null)
    setAttendanceMeetingId(meeting.project_meeting_id)
  }

  const closeAttendanceDialog = () => {
    setAttendanceMeetingId(null)
    setAttendanceDrafts({})
    setMeetingNotes("")
    setApiError(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setApiError(null)
    const parsed = meetingFormSchema.safeParse(formData)

    if (!parsed.success) {
      setErrors(
        Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0] as string, issue.message]))
      )
      return
    }

    setErrors({})
    setSubmitting(true)

    try {
      const response = await fetch("/api/faculty/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })

      const result = await response.json()

      if (response.ok) {
        setOpenSchedule(false)
        setFormData({
          project_group_id: "",
          meeting_date_time: "",
          meeting_purpose: "",
          meeting_location: "",
        })
        await loadData()
      } else {
        setApiError(result.error || "Failed to schedule meeting.")
      }
    } catch (error) {
      console.error(error)
      setApiError("Failed to schedule meeting.")
    } finally {
      setSubmitting(false)
    }
  }

  const submitAttendance = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!attendanceMeetingId || !activeMeeting) {
      setApiError("Meeting not found.")
      return
    }

    const attendance = Object.values(attendanceDrafts)

    if (!attendance.length) {
      setApiError("No attendance records found for this meeting.")
      return
    }

    setSubmitting(true)
    setApiError(null)

    try {
      const response = await fetch("/api/faculty/meetings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meeting_id: attendanceMeetingId,
          meeting_notes: meetingNotes,
          attendance,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        closeAttendanceDialog()
        await loadData()
      } else {
        setApiError(result.error || "Failed to save attendance.")
      }
    } catch (error) {
      console.error(error)
      setApiError("Failed to save attendance.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FacultyPageShell
      title="Meetings"
      description="Schedule guide sessions and complete attendance for each meeting from the pending meeting cards."
      metrics={[
        {
          label: "Scheduled",
          value: scheduledMeetings.length,
          hint: "Meetings waiting for attendance completion.",
          tone: "amber",
        },
        {
          label: "Completed",
          value: completedMeetings.length,
          hint: "Meetings with saved attendance.",
          tone: "emerald",
        },
      ]}
      action={
        <Dialog open={openSchedule} onOpenChange={setOpenSchedule}>
          <DialogTrigger asChild>
            <Button className="rounded-xl">
              <PlusCircle className="mr-2 h-4 w-4" />
              Schedule meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[28px]">
            <DialogHeader>
              <DialogTitle>Schedule meeting</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Project group</Label>
                <Select
                  value={formData.project_group_id}
                  onValueChange={(value) =>
                    setFormData((current) => ({ ...current, project_group_id: value }))
                  }
                >
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
                {errors.project_group_id ? <p className="text-sm text-destructive">{errors.project_group_id}</p> : null}
              </div>
              <div className="space-y-2">
                <Label>Date and time</Label>
                <Input
                  type="datetime-local"
                  value={formData.meeting_date_time}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, meeting_date_time: event.target.value }))
                  }
                />
                {errors.meeting_date_time ? <p className="text-sm text-destructive">{errors.meeting_date_time}</p> : null}
              </div>
              <div className="space-y-2">
                <Label>Purpose</Label>
                <Input
                  value={formData.meeting_purpose}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, meeting_purpose: event.target.value }))
                  }
                />
                {errors.meeting_purpose ? <p className="text-sm text-destructive">{errors.meeting_purpose}</p> : null}
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={formData.meeting_location}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, meeting_location: event.target.value }))
                  }
                />
                {errors.meeting_location ? <p className="text-sm text-destructive">{errors.meeting_location}</p> : null}
              </div>
              {apiError ? <p className="text-sm text-destructive">{apiError}</p> : null}
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setOpenSchedule(false)}>
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
      <Dialog open={Boolean(attendanceMeetingId)} onOpenChange={(open) => (!open ? closeAttendanceDialog() : null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-[28px]">
          <DialogHeader>
            <DialogTitle>Take attendance</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitAttendance} className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <p className="font-semibold">{activeMeeting?.meeting_purpose || "Meeting"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeMeeting?.acd_project_group?.project_group_name || "Project group not available"}
              </p>
            </div>

            <div className="space-y-3">
              {(activeMeeting?.acd_project_meeting_attendance || []).map((attendance) => {
                const draft = attendanceDrafts[attendance.student_id]

                return (
                  <div
                    key={attendance.project_meeting_attendance_id}
                    className="rounded-2xl border border-border/60 bg-background/70 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium">{attendance.acd_student?.student_name || "Student"}</p>
                        <p className="text-sm text-muted-foreground">
                          {attendance.acd_student?.enrollment_number || "Enrollment unavailable"}
                        </p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Select
                          value={draft?.attendance_remark || "Absent"}
                          onValueChange={(value) =>
                            setAttendanceDrafts((current) => ({
                              ...current,
                              [attendance.student_id]: {
                                student_id: attendance.student_id,
                                is_present: value !== "Absent",
                                attendance_remark: value as AttendanceDraft["attendance_remark"],
                              },
                            }))
                          }
                        >
                          <SelectTrigger className="min-w-40">
                            <SelectValue placeholder="Attendance status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Present">Present</SelectItem>
                            <SelectItem value="Absent">Absent</SelectItem>
                            <SelectItem value="Late">Late</SelectItem>
                            <SelectItem value="On_Leave">On leave</SelectItem>
                            <SelectItem value="Excused">Excused</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="space-y-2">
              <Label>Meeting notes</Label>
              <Textarea
                className="min-h-28 resize-none"
                value={meetingNotes}
                onChange={(event) => setMeetingNotes(event.target.value)}
              />
            </div>

            {apiError ? <p className="text-sm text-destructive">{apiError}</p> : null}

            <DialogFooter>
              <Button variant="outline" type="button" onClick={closeAttendanceDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save attendance"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="scheduled" className="grid gap-6">
        <TabsList className="bg-background/80 border border-border/60 justify-start h-auto w-full flex-wrap p-1">
          <TabsTrigger value="scheduled" className="flex-1 min-w-[120px]">
            Scheduled
            {scheduledMeetings.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-700">
                {scheduledMeetings.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 min-w-[120px]">
            Completed
            {completedMeetings.length > 0 && (
              <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-700">
                {completedMeetings.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-4">
          <div className="grid gap-5">
            {loading ? (
              <div className="flex h-64 items-center justify-center rounded-[28px] border border-border/60 bg-background/90">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : scheduledMeetings.length ? (
              scheduledMeetings.map((meeting) => (
                <MeetingCard key={meeting.project_meeting_id} meeting={meeting} openAttendanceDialog={openAttendanceDialog} />
              ))
            ) : (
              <EmptyState message="No scheduled meetings." />
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-4">
          <div className="grid gap-5">
            {loading ? (
              <div className="flex h-64 items-center justify-center rounded-[28px] border border-border/60 bg-background/90">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : completedMeetings.length ? (
              completedMeetings.map((meeting) => (
                <MeetingCard key={meeting.project_meeting_id} meeting={meeting} openAttendanceDialog={openAttendanceDialog} />
              ))
            ) : (
              <EmptyState message="No completed meetings." />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </FacultyPageShell>
  )
}

function MeetingCard({ meeting, openAttendanceDialog }: { meeting: Meeting, openAttendanceDialog: (meeting: Meeting) => void }) {
  return (
    <Card className="rounded-[28px] border-emerald-500/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-xl">{meeting.meeting_purpose || "Meeting"}</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            {meeting.acd_project_group?.project_group_name || "Group not available"}
          </p>
        </div>
        <Badge variant="outline" className={`rounded-full ${meeting.meeting_status === "Scheduled" ? "border-amber-500/30 bg-amber-500/10 text-amber-700" : meeting.meeting_status === "Completed" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700" : ""}`}>
          {meeting.meeting_status || "Scheduled"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <div>
          {new Date(meeting.meeting_date_time).toLocaleDateString()} at{" "}
          {new Date(meeting.meeting_date_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {meeting.meeting_location ? ` · ${meeting.meeting_location}` : ""}
        </div>
        {meeting.meeting_notes ? <p>{meeting.meeting_notes}</p> : null}
        {meeting.meeting_status === "Scheduled" ? (
          <Button
            variant="outline"
            className="rounded-xl bg-background/70"
            onClick={() => openAttendanceDialog(meeting)}
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            Take attendance
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="rounded-[28px] border-emerald-500/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
      <CardContent className="flex flex-col items-center justify-center p-8 text-center text-sm text-muted-foreground">
        <CheckSquare className="mb-3 h-8 w-8 text-muted-foreground/50" />
        {message}
      </CardContent>
    </Card>
  )
}

