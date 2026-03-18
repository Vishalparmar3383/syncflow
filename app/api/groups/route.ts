import { NextResponse } from "next/server"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"

const groupFiltersSchema = z.object({
  type: z.coerce.number().int().positive().optional(),
  year: z.coerce.number().int().positive().optional(),
})

const createGroupSchema = z.object({
  project_group_name: z.string().trim().min(2).max(255),
  project_title: z.string().trim().min(4).max(255),
  project_description: z.string().trim().min(20).max(5000),
  project_area: z.string().trim().min(2).max(255),
  project_type_id: z.coerce.number().int().positive(),
  guide_staff_id: z.coerce.number().int().positive(),
  academic_year_id: z.coerce.number().int().positive(),
})

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const parsed = groupFiltersSchema.safeParse({
    type: searchParams.get("type") ?? undefined,
    year: searchParams.get("year") ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid group filters" }, { status: 400 })
  }

  const where: {
    project_type_id?: number
    academic_year_id?: number
    acd_project_group_member?: { some: { student_id: number } }
    OR?: Array<
      | { guide_staff_id: number }
      | { convener_staff_id: number }
      | { expert_staff_id: number }
    >
  } = {}

  if (parsed.data.type) {
    where.project_type_id = parsed.data.type
  }

  if (parsed.data.year) {
    where.academic_year_id = parsed.data.year
  }

  if (session.role === "Student") {
    const student = await prisma.acd_student.findUnique({
      where: { user_id: Number(session.userId) },
      select: { student_id: true },
    })

    if (student) {
      where.acd_project_group_member = {
        some: { student_id: student.student_id },
      }
    }
  } else if (session.role === "Faculty") {
    const staff = await prisma.acd_staff.findUnique({
      where: { user_id: Number(session.userId) },
      select: { staff_id: true },
    })

    if (staff) {
      where.OR = [
        { guide_staff_id: staff.staff_id },
        { convener_staff_id: staff.staff_id },
        { expert_staff_id: staff.staff_id },
      ]
    }
  }

  try {
    const groups = await prisma.acd_project_group.findMany({
      where,
      include: {
        acd_project_group_member: {
          include: { acd_student: true },
        },
        acd_project_type: true,
        acd_staff_acd_project_group_guide_staff_idToacd_staff: true,
      },
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error("Groups GET Error:", error)
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = createGroupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid group payload" }, { status: 400 })
    }

    const [projectType, academicYear, guide] = await Promise.all([
      prisma.acd_project_type.findUnique({
        where: { project_type_id: parsed.data.project_type_id },
        select: { project_type_id: true, project_type_name: true },
      }),
      prisma.acd_academic_year.findUnique({
        where: { academic_year_id: parsed.data.academic_year_id },
        select: { academic_year_id: true, academic_year_code: true },
      }),
      prisma.acd_staff.findUnique({
        where: { staff_id: parsed.data.guide_staff_id },
        select: { staff_id: true, staff_name: true },
      }),
    ])

    if (!projectType || !academicYear || !guide) {
      return NextResponse.json(
        { error: "Guide, project type, or academic year is invalid" },
        { status: 400 }
      )
    }

    const student =
      session.role === "Student"
        ? await prisma.acd_student.findUnique({
            where: { user_id: Number(session.userId) },
            select: { student_id: true, cgpa: true, student_name: true },
          })
        : null

    if (student) {
      const activeProject = await prisma.acd_project_group_member.findFirst({
        where: {
          student_id: student.student_id,
          acd_project_group: {
            progress_percentage: {
              lt: 100,
            },
            approval_status: {
              not: "Rejected",
            },
          },
        },
        include: {
          acd_project_group: {
            select: {
              project_group_name: true,
              project_title: true,
              progress_percentage: true,
            },
          },
        },
      })

      if (activeProject) {
        return NextResponse.json(
          {
            error: `Complete your current project first (100% progress). Current project: ${activeProject.acd_project_group.project_group_name} (${Number(activeProject.acd_project_group.progress_percentage ?? 0)}%).`,
          },
          { status: 409 }
        )
      }
    }

    const groupDescription = `Proposal for ${parsed.data.project_title} in ${academicYear.academic_year_code} under ${projectType.project_type_name}, guided by ${guide.staff_name}.`

    const group = await prisma.$transaction(async (tx) => {
      const createdGroup = await tx.acd_project_group.create({
        data: {
          project_group_name: parsed.data.project_group_name,
          project_title: parsed.data.project_title,
          project_type_id: parsed.data.project_type_id,
          academic_year_id: parsed.data.academic_year_id,
          guide_staff_id: parsed.data.guide_staff_id,
          project_area: parsed.data.project_area,
          project_description: parsed.data.project_description,
          average_cpi: student?.cgpa ?? null,
          group_status: "Active",
          approval_status: "Pending",
          progress_percentage: 0,
          description: groupDescription,
        },
      })

      if (student) {
        await tx.acd_project_group_member.create({
          data: {
            project_group_id: createdGroup.project_group_id,
            student_id: student.student_id,
            is_group_leader: true,
            student_cgpa: student.cgpa ?? 0,
            description: `${student.student_name} added as group leader during group creation.`,
          },
        })
      }

      return createdGroup
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error("Groups POST Error:", error)
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 })
  }
}
