import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

type SummaryItem = {
  title: string
  subtitle: string
  href: string
}

export async function GET() {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = Number(session.userId)
  const now = new Date()

  const meetings: SummaryItem[] = []
  const notifications: SummaryItem[] = []

  if (session.role === "Student") {
    const student = await prisma.acd_student.findUnique({
      where: { user_id: userId },
      select: { student_id: true },
    })

    if (!student) {
      return NextResponse.json({ meetings, notifications })
    }

    const upcomingMeetings = await prisma.acd_project_meeting.findMany({
      where: {
        meeting_date_time: { gte: now },
        acd_project_group: {
          acd_project_group_member: { some: { student_id: student.student_id } },
        },
      },
      include: { acd_project_group: { select: { project_group_name: true } } },
      orderBy: { meeting_date_time: "asc" },
      take: 3,
    })

    meetings.push(
      ...upcomingMeetings.map((meeting) => ({
        title: meeting.meeting_purpose || "Upcoming meeting",
        subtitle: `${meeting.acd_project_group?.project_group_name || "Group"} on ${meeting.meeting_date_time.toLocaleDateString()}`,
        href: "/student/meetings",
      }))
    )

    const group = await prisma.acd_project_group.findFirst({
      where: {
        acd_project_group_member: { some: { student_id: student.student_id } },
      },
      include: {
        acd_project_document: {
          orderBy: { uploaded_at: "desc" },
          take: 2,
        },
      },
    })

    if (group) {
      notifications.push({
        title: `Proposal status: ${group.approval_status}`,
        subtitle: group.project_title,
        href: "/student/group",
      })

      notifications.push(
        ...group.acd_project_document.map((document) => ({
          title: `${document.document_type} uploaded`,
          subtitle: document.document_name,
          href: "/student/documents",
        }))
      )
    }
  } else if (session.role === "Faculty") {
    const staff = await prisma.acd_staff.findUnique({
      where: { user_id: userId },
      select: { staff_id: true },
    })

    if (!staff) {
      return NextResponse.json({ meetings, notifications })
    }

    const [upcomingMeetings, pendingProposals, recentEvaluation] = await Promise.all([
      prisma.acd_project_meeting.findMany({
        where: { guide_staff_id: staff.staff_id, meeting_date_time: { gte: now } },
        include: { acd_project_group: { select: { project_group_name: true } } },
        orderBy: { meeting_date_time: "asc" },
        take: 3,
      }),
      prisma.acd_project_group.count({
        where: { guide_staff_id: staff.staff_id, approval_status: "Pending" },
      }),
      prisma.acd_project_evaluation.findFirst({
        where: { evaluator_staff_id: staff.staff_id },
        include: { acd_project_group: { select: { project_group_name: true } } },
        orderBy: { created_at: "desc" },
      }),
    ])

    meetings.push(
      ...upcomingMeetings.map((meeting) => ({
        title: meeting.meeting_purpose || "Upcoming meeting",
        subtitle: `${meeting.acd_project_group?.project_group_name || "Group"} on ${meeting.meeting_date_time.toLocaleDateString()}`,
        href: "/faculty/meetings",
      }))
    )

    notifications.push({
      title: `${pendingProposals} pending proposals`,
      subtitle: "Guide decisions waiting for review",
      href: "/faculty/proposals",
    })

    if (recentEvaluation) {
      notifications.push({
        title: "Recent evaluation recorded",
        subtitle: recentEvaluation.acd_project_group?.project_group_name || "Project group",
        href: "/faculty/evaluations",
      })
    }
  } else {
    const [upcomingMeetings, pendingGroups, activeYear] = await Promise.all([
      prisma.acd_project_meeting.findMany({
        where: { meeting_date_time: { gte: now } },
        include: { acd_project_group: { select: { project_group_name: true } } },
        orderBy: { meeting_date_time: "asc" },
        take: 3,
      }),
      prisma.acd_project_group.count({
        where: { approval_status: "Pending" },
      }),
      prisma.acd_academic_year.findFirst({
        where: { is_active: true },
        select: { academic_year_code: true },
      }),
    ])

    meetings.push(
      ...upcomingMeetings.map((meeting) => ({
        title: meeting.meeting_purpose || "Upcoming meeting",
        subtitle: `${meeting.acd_project_group?.project_group_name || "Group"} on ${meeting.meeting_date_time.toLocaleDateString()}`,
        href: "/admin/groups",
      }))
    )

    notifications.push({
      title: `${pendingGroups} groups pending approval`,
      subtitle: "Admin review queue",
      href: "/admin/groups",
    })

    if (activeYear) {
      notifications.push({
        title: `Active academic year: ${activeYear.academic_year_code}`,
        subtitle: "Configuration is currently live",
        href: "/admin/academic-years",
      })
    }
  }

  return NextResponse.json({
    meetings,
    notifications,
  })
}
