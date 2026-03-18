import { createHash } from "crypto"

const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET
const uploadFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || "syncflow"



function assertCloudinaryConfig() {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables are not configured")
  }
}

function signParams(params: Record<string, string>) {
  assertCloudinaryConfig()

  const sortedEntries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))

  const toSign = sortedEntries.map(([key, value]) => `${key}=${value}`).join("&")
  return createHash("sha1")
    .update(`${toSign}${apiSecret}`)
    .digest("hex")
}

export async function uploadFileToCloudinary(file: File, options?: { folder?: string; publicId?: string }) {
  assertCloudinaryConfig()

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const folder = options?.folder || uploadFolder
  const publicId = options?.publicId

  const signature = signParams({
    folder,
    public_id: publicId || "",
    timestamp,
  })

  const formData = new FormData()
  formData.append("file", file)
  formData.append("api_key", apiKey!)
  formData.append("timestamp", timestamp)
  formData.append("folder", folder)
  if (publicId) {
    formData.append("public_id", publicId)
  }
  formData.append("signature", signature)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
    method: "POST",
    body: formData,
  })

  const result = await response.json()
  if (!response.ok) {
    throw new Error(result.error?.message || "Cloudinary upload failed")
  }

  return result as {
    secure_url: string
    public_id: string
    bytes: number
    format?: string
    version?: number
    original_filename?: string
  }
}

/**
 * Generate a signed URL for downloading Cloudinary files.
 * Mirrors the getSignedDownloadUrl() logic in cloudinary.js.
 * Uses cloudinary.utils.private_download_url.
 */
export function getSignedDownloadUrl(publicId: string, filename: string): string {
  assertCloudinaryConfig()

  // For the /raw/download API endpoint, the public_id must be passed as-is
  // (including the file extension). Cloudinary stores raw files with the
  // extension in the public_id, so we do NOT strip it here.
  const cleanPublicId = publicId

  // Build the signed URL manually using SHA-1 signing
  // This matches exactly how cloudinary.js does it.
  const timestamp = String(Math.floor(Date.now() / 1000))
  const expiresAt = String(Number(timestamp) + 3600)

  // Parameters that go into the signature (must include timestamp)
  const paramsToSign: Record<string, string> = {
    attachment: "true",
    expires_at: expiresAt,
    public_id: cleanPublicId,
    timestamp,
  }

  const toSign =
    Object.entries(paramsToSign)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("&") + apiSecret!

  const signature = createHash("sha1").update(toSign).digest("hex")

  const params = new URLSearchParams({
    ...paramsToSign,
    api_key: apiKey!,
    signature,
  })

  return `https://api.cloudinary.com/v1_1/${cloudName}/raw/download?${params.toString()}`
}
