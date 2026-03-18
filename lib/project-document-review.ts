type ReviewStatus = "Pending review" | "Accepted" | "Rejected"

export type ParsedDocumentReview = {
  studentNote: string
  reviewStatus: ReviewStatus
  reviewNote: string
  reviewedBy: string
  reviewedAt: string
}

const DEFAULT_REVIEW: ParsedDocumentReview = {
  studentNote: "",
  reviewStatus: "Pending review",
  reviewNote: "",
  reviewedBy: "",
  reviewedAt: "",
}

export function parseDocumentDescription(description?: string | null): ParsedDocumentReview {
  if (!description) {
    return DEFAULT_REVIEW
  }

  const parsed = description.split("\n").reduce<Record<string, string>>((accumulator, line) => {
    const [key, ...rest] = line.split("::")
    if (key && rest.length) {
      accumulator[key.trim()] = rest.join("::").trim()
    }
    return accumulator
  }, {})

  const hasStructuredReview =
    "STUDENT_NOTE" in parsed ||
    "REVIEW_STATUS" in parsed ||
    "REVIEW_NOTE" in parsed ||
    "REVIEWED_BY" in parsed ||
    "REVIEWED_AT" in parsed

  if (!hasStructuredReview) {
    return {
      ...DEFAULT_REVIEW,
      studentNote: description,
    }
  }

  return {
    studentNote: parsed.STUDENT_NOTE || "",
    reviewStatus:
      parsed.REVIEW_STATUS === "Accepted"
        ? "Accepted"
        : parsed.REVIEW_STATUS === "Reviewed"
          ? "Accepted"
        : parsed.REVIEW_STATUS === "Rejected"
          ? "Rejected"
          : "Pending review",
    reviewNote: parsed.REVIEW_NOTE || "",
    reviewedBy: parsed.REVIEWED_BY || "",
    reviewedAt: parsed.REVIEWED_AT || "",
  }
}

export function buildDocumentDescription(input: {
  studentNote?: string
  reviewStatus?: ReviewStatus
  reviewNote?: string
  reviewedBy?: string
  reviewedAt?: string
}) {
  return [
    `STUDENT_NOTE::${input.studentNote || ""}`,
    `REVIEW_STATUS::${input.reviewStatus || "Pending review"}`,
    `REVIEW_NOTE::${input.reviewNote || ""}`,
    `REVIEWED_BY::${input.reviewedBy || ""}`,
    `REVIEWED_AT::${input.reviewedAt || ""}`,
  ].join("\n")
}
