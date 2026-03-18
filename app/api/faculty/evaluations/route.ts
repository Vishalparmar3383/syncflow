import { NextResponse } from "next/server"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import { calculateRubricAverage, EVALUATION_RUBRIC } from "@/lib/evaluation-rubric"

const evaluationSchema = z.object({
  evaluation_id: z.coerce.number().int().positive(),
  remarks: z.string().trim().max(1000).optional().or(z.literal("")),
  progress_percentage: z.coerce.number().min(0).max(100),
  scores: z.record(z.string(), z.coerce.number().min(0).max(100)),
})

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "Faculty") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const staff = await prisma.acd_staff.findUnique({
      where: { user_id: Number(session.userId) },
    })

    if (!staff) {
      return NextResponse.json({ error: "Staff profile not found" }, { status: 404 })
    }

    const evaluations = await prisma.acd_project_evaluation.findMany({
      where: { evaluator_staff_id: staff.staff_id },
      include: {
        acd_project_group: true,
        acd_project_evaluation_detail: true,
      },
      orderBy: { created_at: "desc" },
    })

    return NextResponse.json(evaluations)
  } catch (error) {
    console.error("Faculty Evaluations GET Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "Faculty") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const staff = await prisma.acd_staff.findUnique({
      where: { user_id: Number(session.userId) },
    })

    if (!staff) {
      return NextResponse.json({ error: "Staff profile not found" }, { status: 404 })
    }

    const body = await request.json()
    const parsed = evaluationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid evaluation payload", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const rubricScores = EVALUATION_RUBRIC.map((criterion) => ({
      criteria_name: criterion.title,
      score: parsed.data.scores[criterion.key] ?? 0,
    }))

    const { average, details } = calculateRubricAverage(rubricScores)

    const existingEvaluation = await prisma.acd_project_evaluation.findUnique({
      where: { evaluation_id: parsed.data.evaluation_id },
      include: { acd_project_group: true },
    })

    if (!existingEvaluation) {
      return NextResponse.json({ error: "Evaluation request not found" }, { status: 404 })
    }

    if (existingEvaluation.evaluator_staff_id !== staff.staff_id) {
      return NextResponse.json({ error: "This evaluation is not assigned to you" }, { status: 403 })
    }

    if (existingEvaluation.evaluation_status !== "Pending") {
      return NextResponse.json({ error: "Only pending evaluation requests can be completed" }, { status: 400 })
    }

    const currentProgress = Number(existingEvaluation.acd_project_group.progress_percentage ?? 0)

    if (parsed.data.progress_percentage < currentProgress) {
      return NextResponse.json(
        { error: `Progress can only increase. Current progress is ${currentProgress}%.` },
        { status: 400 }
      )
    }

    const updatedEvaluation = await prisma.$transaction(async (tx) => {
      await tx.acd_project_evaluation_detail.deleteMany({
        where: { evaluation_id: parsed.data.evaluation_id },
      })

      const evaluation = await tx.acd_project_evaluation.update({
        where: { evaluation_id: parsed.data.evaluation_id },
        data: {
          evaluation_date: new Date(),
          total_marks: average,
          awarded_progress: parsed.data.progress_percentage,
          remarks: parsed.data.remarks || null,
          evaluation_status: "Completed",
          description: `Evaluation completed by ${staff.staff_name} for ${existingEvaluation.acd_project_group.project_group_name}.`,
          updated_at: new Date(),
          acd_project_evaluation_detail: {
            create: details.map((detail) => ({
              criteria_name: detail.title,
              marks_obtained: Number(detail.score.toFixed(2)),
              max_marks: 100,
              weightage: null,
              description: `${detail.title} scored ${detail.score} out of 100.`,
            })),
          },
        },
        include: {
          acd_project_evaluation_detail: true,
        },
      })

      const nextProgress = Number(parsed.data.progress_percentage.toFixed(2))
      await tx.acd_project_group.update({
        where: { project_group_id: existingEvaluation.project_group_id },
        data: {
          progress_percentage: nextProgress,
          group_status: nextProgress >= 100 ? "Completed" : undefined,
          updated_at: new Date(),
        },
      })

      return evaluation
    })

    return NextResponse.json(updatedEvaluation)
  } catch (error) {
    console.error("Faculty Evaluation POST Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
