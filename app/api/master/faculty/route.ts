import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const faculty = await prisma.acd_staff.findMany({
      include: {
        acd_department: true,
      },
      orderBy: { staff_name: "asc" },
    })

    return NextResponse.json(faculty)
  } catch (error) {
    console.error("Master Faculty GET Error:", error)
    return NextResponse.json({ error: "Failed to fetch faculty" }, { status: 500 })
  }
}
