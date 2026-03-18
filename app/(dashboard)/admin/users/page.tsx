import Link from "next/link"
import { ArrowRight, GraduationCap, Users } from "lucide-react"

import { AdminPageShell } from "@/components/admin/admin-page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function AdminUsersPage() {
  return (
    <AdminPageShell
      title="User directories"
      description="Use the dedicated faculty and student views for focused administrative work with cleaner routing."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-[28px] border-sky-500/20 bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
          <CardContent className="space-y-5 p-6">
            <Users className="h-6 w-6 text-sky-700" />
            <div>
              <h2 className="text-2xl font-semibold">Faculty directory</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Review staff assignments, department coverage, and account status.
              </p>
            </div>
            <Button asChild className="rounded-xl">
              <Link href="/admin/faculty">
                Open faculty
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-emerald-500/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
          <CardContent className="space-y-5 p-6">
            <GraduationCap className="h-6 w-6 text-emerald-700" />
            <div>
              <h2 className="text-2xl font-semibold">Student directory</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Review enrollment details, department distribution, and account state.
              </p>
            </div>
            <Button asChild className="rounded-xl">
              <Link href="/admin/students">
                Open students
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminPageShell>
  )
}
