import { NextResponse } from "next/server"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import { uploadFileToCloudinary } from "@/lib/cloudinary"
import { buildDocumentDescription, parseDocumentDescription } from "@/lib/project-document-review"

const documentTypeSchema = z.enum(["Proposal", "Report", "Code", "Presentation", "Other"])

const documentsQuerySchema = z.object({
  group_id: z.coerce.number().int().positive(),
})

const uploadMetaSchema = z.object({
  project_group_id: z.coerce.number().int().positive(),
  document_type: documentTypeSchema,
  description: z.string().trim().max(1000).optional().or(z.literal("")),
})

async function canAccessGroup(projectGroupId: number, userId: number, role: string) {
  if (role === "Admin") {
    return true
  }

  if (role === "Student") {
    const student = await prisma.acd_student.findUnique({
      where: { user_id: userId },
      select: { student_id: true },
    })

    if (!student) return false

    const membership = await prisma.acd_project_group_member.findFirst({
      where: {
        project_group_id: projectGroupId,
        student_id: student.student_id,
      },
      select: { project_group_member_id: true },
    })

    return Boolean(membership)
  }

  if (role === "Faculty") {
    const staff = await prisma.acd_staff.findUnique({
      where: { user_id: userId },
      select: { staff_id: true },
    })

    if (!staff) return false

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

    return Boolean(group)
  }

  return false
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const fileValue = formData.get("file")

    if (!(fileValue instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    const parsed = uploadMetaSchema.safeParse({
      project_group_id: formData.get("project_group_id"),
      document_type: formData.get("document_type"),
      description: formData.get("description") ?? "",
    })

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid document payload" }, { status: 400 })
    }

    const canAccess = await canAccessGroup(
      parsed.data.project_group_id,
      Number(session.userId),
      session.role
    )

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const latestDocument = await prisma.acd_project_document.findFirst({
      where: {
        project_group_id: parsed.data.project_group_id,
        document_type: parsed.data.document_type,
      },
      orderBy: { version: "desc" },
      select: { version: true },
    })

    const uploadResult = await uploadFileToCloudinary(fileValue, {
      folder: `syncflow/group-${parsed.data.project_group_id}/${parsed.data.document_type.toLowerCase()}`,
      publicId: `${Date.now()}-${fileValue.name.replace(/\s+/g, "-")}`,
    })

    const document = await prisma.acd_project_document.create({
      data: {
        project_group_id: parsed.data.project_group_id,
        document_name: fileValue.name,
        document_type: parsed.data.document_type,
        document_path: uploadResult.secure_url,
        file_size: BigInt(uploadResult.bytes),
        uploaded_by: Number(session.userId),
        version: (latestDocument?.version ?? 0) + 1,
        description: buildDocumentDescription({
          studentNote: parsed.data.description || `${parsed.data.document_type} uploaded by ${session.email}`,
          reviewStatus: "Pending review",
        }),
      },
    })

    return NextResponse.json(
      {
        ...document,
        file_size: document.file_size?.toString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Projects Documents POST Error:", error)
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const parsed = documentsQuerySchema.safeParse({
    group_id: searchParams.get("group_id"),
  })

  if (!parsed.success) {
    return NextResponse.json({ error: "Valid group ID required" }, { status: 400 })
  }

  const canAccess = await canAccessGroup(
    parsed.data.group_id,
    Number(session.userId),
    session.role
  )

  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const documents = await prisma.acd_project_document.findMany({
      where: { project_group_id: parsed.data.group_id },
      include: { acd_user: { select: { email: true } } },
      orderBy: { uploaded_at: "desc" },
    })

    return NextResponse.json(
      documents.map((document) => ({
        ...document,
        file_size: document.file_size?.toString(),
        review: parseDocumentDescription(document.description),
      }))
    )
  } catch (error) {
    console.error("Projects Documents GET Error:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}
