import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { hashPassword } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

const RESET_COOKIE = "password_reset_request"

const verifySchema = z
  .object({
    email: z.email("Enter a valid email address"),
    otp: z.string().trim().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = verifySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid reset request", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const cookieStore = await cookies()
    const resetCookie = cookieStore.get(RESET_COOKIE)?.value

    if (!resetCookie) {
      return NextResponse.json({ error: "OTP session expired. Request a new OTP." }, { status: 400 })
    }

    const resetData = JSON.parse(resetCookie) as {
      email: string
      otpHash: string
      expiresAt: number
    }

    if (resetData.email !== parsed.data.email) {
      return NextResponse.json({ error: "OTP request does not match this email" }, { status: 400 })
    }

    if (Date.now() > resetData.expiresAt) {
      cookieStore.delete(RESET_COOKIE)
      return NextResponse.json({ error: "OTP expired. Request a new OTP." }, { status: 400 })
    }

    const isValidOtp = await bcrypt.compare(parsed.data.otp, resetData.otpHash)
    if (!isValidOtp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 })
    }

    const user = await prisma.acd_user.findUnique({
      where: { email: parsed.data.email },
      select: { user_id: true, is_active: true },
    })

    if (!user || !user.is_active) {
      return NextResponse.json({ error: "No active account found for this email" }, { status: 404 })
    }

    const password_hash = await hashPassword(parsed.data.newPassword)

    await prisma.acd_user.update({
      where: { user_id: user.user_id },
      data: { password_hash },
    })

    cookieStore.delete(RESET_COOKIE)

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. You can login with the new password.",
    })
  } catch {
    return NextResponse.json({ error: "Unable to verify OTP" }, { status: 500 })
  }
}
