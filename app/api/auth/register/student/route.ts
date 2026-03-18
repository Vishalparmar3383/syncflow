import { NextResponse } from "next/server"
import { z } from "zod"

import { hashPassword } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

const studentSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  student_name: z.string().trim().min(3, "Student name is required").max(255, "Student name is too long"),
  phone: z.string().trim().regex(/^\d{10}$/, "Phone must be exactly 10 digits").optional(),
  enrollment_number: z.string().trim().min(1, "Enrollment number is required").max(50, "Enrollment number is too long"),
  department_id: z.number().int().positive(),
  academic_year_id: z.number().int().positive(),
  cgpa: z.number().min(0).max(10).optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = studentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid student registration data", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const existingUser = await prisma.acd_user.findUnique({ where: { email: parsed.data.email } })
    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 })
    }

    const password_hash = await hashPassword(parsed.data.password)

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.acd_user.create({
        data: {
          email: parsed.data.email,
          password_hash,
          role: "Student",
        },
      })

      await tx.acd_student.create({
        data: {
          user_id: user.user_id,
          student_name: parsed.data.student_name,
          phone: parsed.data.phone || null,
          email: parsed.data.email,
          enrollment_number: parsed.data.enrollment_number,
          department_id: parsed.data.department_id,
          academic_year_id: parsed.data.academic_year_id,
          cgpa: parsed.data.cgpa ?? 0,
          description: `Student profile created via self-service registration on ${new Date().toISOString()}.`,
        },
      })

      return user
    })

    return NextResponse.json({ success: true, userId: created.user_id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Unable to create student account" }, { status: 500 })
  }
}
