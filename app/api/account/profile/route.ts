import { NextResponse } from "next/server"
import { z } from "zod"

import { getSession } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

const profileSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(255, "Name is too long"),
  phone: z.string().trim().regex(/^\d{10}$/, "Phone must be exactly 10 digits").or(z.literal("")),
  description: z.string().trim().max(500, "Description is too long").optional(),
  designation: z.string().trim().max(100, "Designation is too long").optional(),
})

export async function GET() {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.acd_user.findUnique({
    where: { user_id: Number(session.userId) },
    include: {
      acd_admin: true,
      acd_student: { include: { acd_department: true, acd_academic_year: true } },
      acd_staff: { include: { acd_department: true } },
    },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const profile =
    user.role === "Admin"
      ? {
          role: user.role,
          email: user.email,
          name: user.acd_admin?.admin_name ?? "",
          phone: user.acd_admin?.phone ?? "",
          description: user.acd_admin?.description ?? "",
          department: null,
          designation: null,
          academicYear: null,
          enrollmentNumber: null,
        }
      : user.role === "Faculty"
        ? {
            role: user.role,
            email: user.email,
            name: user.acd_staff?.staff_name ?? "",
            phone: user.acd_staff?.phone ?? "",
            description: user.acd_staff?.description ?? "",
            department: user.acd_staff?.acd_department?.department_name ?? null,
            designation: user.acd_staff?.designation ?? null,
            academicYear: null,
            enrollmentNumber: null,
          }
        : {
            role: user.role,
            email: user.email,
            name: user.acd_student?.student_name ?? "",
            phone: user.acd_student?.phone ?? "",
            description: user.acd_student?.description ?? "",
            department: user.acd_student?.acd_department?.department_name ?? null,
            designation: null,
            academicYear: user.acd_student?.acd_academic_year?.academic_year_code ?? null,
            enrollmentNumber: user.acd_student?.enrollment_number ?? null,
          }

  return NextResponse.json(profile)
}

export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile data", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const user = await prisma.acd_user.findUnique({
    where: { user_id: Number(session.userId) },
    select: { role: true },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  if (user.role === "Admin") {
    await prisma.acd_admin.update({
      where: { user_id: Number(session.userId) },
      data: {
        admin_name: parsed.data.name,
        phone: parsed.data.phone || null,
        description: parsed.data.description || null,
      },
    })
  } else if (user.role === "Faculty") {
    await prisma.acd_staff.update({
      where: { user_id: Number(session.userId) },
      data: {
        staff_name: parsed.data.name,
        phone: parsed.data.phone || null,
        designation: parsed.data.designation || null,
        description: parsed.data.description || null,
      },
    })
  } else {
    await prisma.acd_student.update({
      where: { user_id: Number(session.userId) },
      data: {
        student_name: parsed.data.name,
        phone: parsed.data.phone || null,
        description: parsed.data.description || null,
      },
    })
  }

  return NextResponse.json({ success: true, message: "Profile updated successfully" })
}
