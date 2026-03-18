import { AdminUserDirectory } from "@/components/admin/admin-user-directory"

export default function AdminFacultyPage() {
  return (
    <AdminUserDirectory
      role="Faculty"
      title="Faculty directory"
      description="Manage teaching staff visibility, supervision capacity, and access across departments."
    />
  )
}
