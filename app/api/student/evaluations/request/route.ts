import { NextResponse } from "next/server"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"

const evaluationRequestSchema = z.object({
  project_group_id: z.coerce.number().int().positive(),
  remarks: z.string().trim().max(1000).optional().or(z.literal("")),
})

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "Student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const student = await prisma.acd_student.findUnique({
      where: { user_id: Number(session.userId) },
      select: { student_id: true, student_name: true },
    })

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
    }

    const body = await request.json()
    const parsed = evaluationRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid evaluation request payload", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const membership = await prisma.acd_project_group_member.findFirst({
      where: {
        project_group_id: parsed.data.project_group_id,
        student_id: student.student_id,
      },
      include: {
        acd_project_group: true,
      },
    })

    if (!membership) {
      return NextResponse.json({ error: "You are not a member of this project group" }, { status: 403 })
    }

    if (!membership.is_group_leader) {
      return NextResponse.json({ error: "Only the student leader can request an evaluation" }, { status: 403 })
    }

    if (membership.acd_project_group.approval_status !== "Approved") {
      return NextResponse.json({ error: "Evaluation can only be requested after proposal approval" }, { status: 400 })
    }

    if (!membership.acd_project_group.guide_staff_id) {
      return NextResponse.json({ error: "A guide must be assigned before requesting evaluation" }, { status: 400 })
    }

    const existingPending = await prisma.acd_project_evaluation.findFirst({
      where: {
        project_group_id: parsed.data.project_group_id,
        evaluation_status: "Pending",
      },
      select: { evaluation_id: true },
    })

    if (existingPending) {
      return NextResponse.json({ error: "An evaluation request is already pending for this group" }, { status: 409 })
    }

    const evaluation = await prisma.acd_project_evaluation.create({
      data: {
        project_group_id: parsed.data.project_group_id,
        evaluator_staff_id: membership.acd_project_group.guide_staff_id,
        evaluation_date: null,
        total_marks: null,
        remarks: null,
        evaluation_status: "Pending",
        description:
          parsed.data.remarks ||
          `Evaluation requested by group leader ${student.student_name} for ${membership.acd_project_group.project_group_name}.`,
      },
    })

    return NextResponse.json(evaluation, { status: 201 })
  } catch (error) {
    console.error("Student Evaluation Request POST Error:", error)
    return NextResponse.json({ error: "Failed to request evaluation" }, { status: 500 })
  }
}
