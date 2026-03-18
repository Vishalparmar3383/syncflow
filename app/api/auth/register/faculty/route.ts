import { NextResponse } from "next/server"
import { z } from "zod"

import { hashPassword } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

const facultySchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  staff_name: z.string().trim().min(3, "Faculty name is required").max(255, "Faculty name is too long"),
  phone: z.string().trim().regex(/^\d{10}$/, "Phone must be exactly 10 digits").optional(),
  department_id: z.number().int().positive(),
  designation: z.string().trim().min(1, "Designation is required").max(100, "Designation is too long"),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = facultySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid faculty registration data", details: parsed.error.flatten().fieldErrors }, { status: 400 })
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
          role: "Faculty",
        },
      })

      await tx.acd_staff.create({
        data: {
          user_id: user.user_id,
          staff_name: parsed.data.staff_name,
          phone: parsed.data.phone || null,
          email: parsed.data.email,
          department_id: parsed.data.department_id,
          designation: parsed.data.designation,
          description: `Faculty profile created via self-service registration on ${new Date().toISOString()}.`,
        },
      })

      return user
    })

    return NextResponse.json({ success: true, userId: created.user_id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Unable to create faculty account" }, { status: 500 })
  }
}
