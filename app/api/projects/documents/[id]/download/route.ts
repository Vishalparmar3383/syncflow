/**
 * Document Download Route
 *
 * Mirrors the working documents.js download logic exactly:
 *  1. Try signed URL via cloudinary SDK (private_download_url)
 *  2. Fallback: proxy fetch from the raw Cloudinary URL
 */

import { v2 as cloudinary } from "cloudinary"

import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

// ─── Cloudinary SDK config ────────────────────────────────────────────────────
cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
})

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract Cloudinary public_id from a secure_url.
 * e.g. https://res.cloudinary.com/demo/raw/upload/v123/folder/file.pdf
 *   → "folder/file.pdf"
 */
function extractPublicId(url: string): string | null {
  try {
    const parts   = new URL(url).pathname.split("/")
    const upIdx   = parts.indexOf("upload")
    if (upIdx === -1) return null
    let rest = parts.slice(upIdx + 1)
    if (/^v\d+$/.test(rest[0])) rest = rest.slice(1) // drop version
    return rest.map(s => decodeURIComponent(s)).join("/")
  } catch {
    return null
  }
}

/**
 * Mirrors the working getSignedDownloadUrl from cloudinary.js exactly.
 * Key: format must be "raw" for raw resource type (pdf/doc/zip etc).
 */
function getSignedDownloadUrl(publicId: string): string {
  return cloudinary.utils.private_download_url(
    publicId,
    "raw",  // ✅ VERY IMPORTANT for pdf/doc/zip
    {
      resource_type: "raw",
      type:          "upload",
      attachment:    true,
      expires_at:    Math.floor(Date.now() / 1000) + 3600,
    }
  )
}

// ─── access check ─────────────────────────────────────────────────────────────

async function canAccessGroup(projectGroupId: number, userId: number, role: string) {
  if (role === "Admin") return true

  if (role === "Student") {
    const student = await prisma.acd_student.findUnique({
      where:  { user_id: userId },
      select: { student_id: true },
    })
    if (!student) return false
    const membership = await prisma.acd_project_group_member.findFirst({
      where:  { project_group_id: projectGroupId, student_id: student.student_id },
      select: { project_group_member_id: true },
    })
    return Boolean(membership)
  }

  if (role === "Faculty") {
    const staff = await prisma.acd_staff.findUnique({
      where:  { user_id: userId },
      select: { staff_id: true },
    })
    if (!staff) return false
    const group = await prisma.acd_project_group.findFirst({
      where: {
        project_group_id: projectGroupId,
        OR: [
          { guide_staff_id:    staff.staff_id },
          { convener_staff_id: staff.staff_id },
          { expert_staff_id:   staff.staff_id },
        ],
      },
      select: { project_group_id: true },
    })
    return Boolean(group)
  }

  return false
}

function buildContentDisposition(filename: string) {
  const ascii   = filename.replace(/[^\x20-\x7E]+/g, "_").replace(/"/g, "")
  const encoded = encodeURIComponent(filename)
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`
}

function getMimeType(name: string) {
  const ext = name.split(".").pop()?.toLowerCase()

  if (ext === "pdf") return "application/pdf"
  if (ext === "doc") return "application/msword"
  if (ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  if (ext === "xls") return "application/vnd.ms-excel"
  if (ext === "xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  if (ext === "ppt") return "application/vnd.ms-powerpoint"
  if (ext === "pptx") return "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  if (ext === "zip") return "application/zip"

  return "application/octet-stream"
}

// ─── route handler ────────────────────────────────────────────────────────────

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id }     = await context.params
    const documentId = Number(id)

    if (!Number.isInteger(documentId) || documentId <= 0) {
      return NextResponse.json({ error: "Invalid document ID" }, { status: 400 })
    }

    const document = await prisma.acd_project_document.findUnique({
      where:  { document_id: documentId },
      select: { document_id: true, document_name: true, document_path: true, project_group_id: true },
    })

    if (!document?.document_path) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const hasAccess = await canAccessGroup(
      document.project_group_id,
      Number(session.userId),
      String(session.role)
    )
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // ── Cloudinary ────────────────────────────────────────────────────────────
    if (document.document_path.includes("cloudinary.com")) {
      const publicId = extractPublicId(document.document_path)
      console.log("📄 document_name:", document.document_name)
      console.log("📄 public_id    :", publicId)

      // Proxy download: fetch file server-side, set correct filename ourselves.
      // This avoids Cloudinary renaming the file to .raw on redirect.
      console.log("⬇️  Proxying from:", document.document_path)
      try {
        let fetchUrl = document.document_path

        // If URL is accessible directly (type=upload), fetch it.
        // Otherwise use signed URL as the fetch source (not redirect target).
        if (publicId) {
          try {
            const signedUrl = getSignedDownloadUrl(publicId)
            const testHead  = await fetch(signedUrl, { method: "HEAD" })
            if (testHead.ok) fetchUrl = signedUrl
          } catch {
            // stick with direct URL
          }
        }

        const upstream = await fetch(fetchUrl)
        if (!upstream.ok || !upstream.body) {
          return NextResponse.json({ error: "Cloudinary fetch failed" }, { status: 502 })
        }

        const headers = new Headers()
        // ✅ Use the original document name so the file downloads as .pdf not .raw
        headers.set("Content-Disposition", buildContentDisposition(document.document_name))
        headers.set("Content-Type", getMimeType(document.document_name))
        const cl = upstream.headers.get("content-length")
        if (cl) headers.set("Content-Length", cl)
        return new Response(upstream.body, { status: 200, headers })
      } catch (err) {
        console.error("Download failed:", err)
        return NextResponse.json({ error: "Download failed" }, { status: 500 })
      }
    }

    // ── Non-Cloudinary fallback ───────────────────────────────────────────────
    const upstream = await fetch(document.document_path)
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Failed to retrieve document" }, { status: 502 })
    }
    const headers = new Headers()
    headers.set("Content-Type",        upstream.headers.get("content-type") ?? "application/octet-stream")
    headers.set("Content-Disposition", buildContentDisposition(document.document_name))
    const cl = upstream.headers.get("content-length")
    if (cl) headers.set("Content-Length", cl)
    return new Response(upstream.body, { status: 200, headers })

  } catch (error) {
    console.error("Download GET Error:", error)
    return NextResponse.json({ error: "Failed to download document" }, { status: 500 })
  }
}
