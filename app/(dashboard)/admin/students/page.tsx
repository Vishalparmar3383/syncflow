import { AdminUserDirectory } from "@/components/admin/admin-user-directory"

export default function AdminStudentsPage() {
  return (
    <AdminUserDirectory
      role="Student"
      title="Student directory"
      description="Monitor enrollment coverage, academic placement, and account readiness for project work."
    />
  )
}
