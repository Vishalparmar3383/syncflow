import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "Student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const student = await prisma.acd_student.findUnique({
      where: { user_id: Number(session.userId) },
      include: {
        acd_department: true,
        acd_academic_year: true,
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 })
    }

    const memberships = await prisma.acd_project_group_member.findMany({
      where: { student_id: student.student_id },
      include: {
        acd_project_group: {
          include: {
            acd_project_type: true,
            acd_staff_acd_project_group_guide_staff_idToacd_staff: true,
            acd_staff_acd_project_group_convener_staff_idToacd_staff: true,
            acd_staff_acd_project_group_expert_staff_idToacd_staff: true,
            acd_project_group_member: {
              include: {
                acd_student: true,
              },
            },
            acd_project_evaluation: {
              include: {
                acd_project_evaluation_detail: true,
              },
              orderBy: { created_at: "desc" },
            },
          },
        },
      },
      orderBy: { updated_at: "desc" },
    })

    const projects = memberships
      .filter((membership) => membership.acd_project_group.approval_status !== "Rejected")
      .map((membership) => ({
      ...membership.acd_project_group,
      progress: Number(membership.acd_project_group.progress_percentage ?? 0),
      membership: {
        project_group_member_id: membership.project_group_member_id,
        is_group_leader: membership.is_group_leader ?? false,
      },
    }))

    const activeProject =
      projects.find((project) => project.group_status === "Active") ||
      projects[0] ||
      null

    let upcomingMeetings: Array<{
      project_meeting_id: number
      meeting_purpose?: string | null
      meeting_date_time: Date
      meeting_location?: string | null
    }> = []

    if (activeProject) {
      upcomingMeetings = await prisma.acd_project_meeting.findMany({
        where: {
          project_group_id: activeProject.project_group_id,
          meeting_date_time: {
            gte: new Date(),
          },
          meeting_status: "Scheduled",
        },
        orderBy: { meeting_date_time: "asc" },
        take: 5,
      })
    }

    return NextResponse.json({
      student,
      group: activeProject,
      projects,
      upcomingMeetings,
    })
  } catch (error) {
    console.error("Student Dashboard API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
