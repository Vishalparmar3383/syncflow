import { NextResponse } from "next/server"
import { z } from "zod"

import { getSession } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { buildDocumentDescription, parseDocumentDescription } from "@/lib/project-document-review"

const reviewSchema = z.object({
  decision: z.enum(["Accepted", "Rejected"]),
  review_note: z.string().trim().min(2).max(1000),
})

async function canReviewDocument(projectGroupId: number, userId: number, role: string) {
  if (role === "Admin") {
    return true
  }

  if (role !== "Faculty") {
    return false
  }

  const staff = await prisma.acd_staff.findUnique({
    where: { user_id: userId },
    select: { staff_id: true, staff_name: true },
  })

  if (!staff) {
    return null
  }

  const group = await prisma.acd_project_group.findFirst({
    where: {
      project_group_id: projectGroupId,
      OR: [
        { guide_staff_id: staff.staff_id },
        { convener_staff_id: staff.staff_id },
        { expert_staff_id: staff.staff_id },
      ],
    },
    select: { project_group_id: true },
  })

  if (!group) {
    return null
  }

  return staff
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const documentId = Number(id)

    if (!Number.isInteger(documentId) || documentId <= 0) {
      return NextResponse.json({ error: "Invalid document ID" }, { status: 400 })
    }

    const body = await request.json()
    const parsed = reviewSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid review payload" }, { status: 400 })
    }

    const document = await prisma.acd_project_document.findUnique({
      where: { document_id: documentId },
      select: {
        document_id: true,
        project_group_id: true,
        description: true,
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const reviewer = await canReviewDocument(
      document.project_group_id,
      Number(session.userId),
      session.role
    )

    if (!reviewer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const existing = parseDocumentDescription(document.description)
    const reviewedAt = new Date().toISOString()

    const updated = await prisma.acd_project_document.update({
      where: { document_id: documentId },
      data: {
        description: buildDocumentDescription({
          studentNote: existing.studentNote,
          reviewStatus: parsed.data.decision,
          reviewNote: parsed.data.review_note,
          reviewedBy: reviewer === true ? session.email : reviewer.staff_name,
          reviewedAt,
        }),
        updated_at: new Date(),
      },
    })

    return NextResponse.json({
      ...updated,
      file_size: updated.file_size?.toString(),
      review: parseDocumentDescription(updated.description),
    })
  } catch (error) {
    console.error("Projects Documents PATCH Error:", error)
    return NextResponse.json({ error: "Failed to review document" }, { status: 500 })
  }
}
