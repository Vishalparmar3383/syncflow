import { NextResponse } from "next/server"
import { z } from "zod"

import { getSession } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

const settingsSchema = z.object({
  theme: z.enum(["Light", "Dark"]),
  desktopNotifications: z.boolean(),
  meetingReminders: z.boolean(),
  compactSidebar: z.boolean(),
})

export async function GET() {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = Number(session.userId)
  const settings = await prisma.acd_user_settings.findUnique({
    where: { user_id: userId },
  })

  return NextResponse.json({
    theme: settings?.theme ?? "Dark",
    desktopNotifications: settings?.desktop_notifications ?? true,
    meetingReminders: settings?.meeting_reminders ?? true,
    compactSidebar: settings?.compact_sidebar ?? false,
  })
}

export async function PUT(request: Request) {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = settingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings data", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const userId = Number(session.userId)
  await prisma.acd_user_settings.upsert({
    where: { user_id: userId },
    create: {
      user_id: userId,
      theme: parsed.data.theme,
      desktop_notifications: parsed.data.desktopNotifications,
      meeting_reminders: parsed.data.meetingReminders,
      compact_sidebar: parsed.data.compactSidebar,
    },
    update: {
      theme: parsed.data.theme,
      desktop_notifications: parsed.data.desktopNotifications,
      meeting_reminders: parsed.data.meetingReminders,
      compact_sidebar: parsed.data.compactSidebar,
      updated_at: new Date(),
    },
  })

  return NextResponse.json({ success: true, message: "Settings saved successfully" })
}
