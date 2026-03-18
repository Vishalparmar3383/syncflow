import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { prisma } from "@/lib/prisma"

const requestSchema = z.object({
  email: z.email("Enter a valid email address"),
})

const RESET_COOKIE = "password_reset_request"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors.email?.[0] ?? "Invalid email" }, { status: 400 })
    }

    const user = await prisma.acd_user.findUnique({
      where: { email: parsed.data.email },
      select: { user_id: true, is_active: true },
    })

    if (!user || !user.is_active) {
      return NextResponse.json({ error: "No active account found for this email" }, { status: 404 })
    }

    const otp = `${Math.floor(100000 + Math.random() * 900000)}`
    const otpHash = await bcrypt.hash(otp, 10)
    const expiresAt = Date.now() + 10 * 60 * 1000

    const cookieStore = await cookies()
    cookieStore.set(
      RESET_COOKIE,
      JSON.stringify({
        email: parsed.data.email,
        otpHash,
        expiresAt,
      }),
      {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        maxAge: 10 * 60,
        path: "/",
      }
    )

    return NextResponse.json({
      success: true,
      message: "OTP prepared. Use the code below to complete this demo flow.",
      devOtp: otp,
    })
  } catch {
    return NextResponse.json({ error: "Unable to generate OTP" }, { status: 500 })
  }
}
