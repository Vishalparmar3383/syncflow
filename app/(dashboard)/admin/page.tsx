"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  Building2,
  CalendarRange,
  FolderKanban,
  GraduationCap,
  Loader2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react"

import { AdminPageShell } from "@/components/admin/admin-page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type RecentUser = {
  user_id: number
  email: string
  role: string
  created_at: string
  acd_student?: { student_name?: string | null } | null
  acd_staff?: { staff_name?: string | null } | null
}

type MonthlyTrend = {
  key: string
  label: string
  users: number
  groups: number
}

type RoleDistribution = {
  label: string
  value: number
  color: "emerald" | "sky" | "amber"
}

type TopDepartment = {
  department_id: number
  department_name: string
  studentCount: number
  facultyCount: number
  totalPeople: number
}

type DashboardData = {
  stats?: {
    totalDepartments: number
    totalFaculty: number
    totalStudents: number
    pendingProposals: number
    activeAY: string
    totalGroups: number
    approvedGroups: number
    rejectedGroups: number
    activeUsers: number
    inactiveUsers: number
  }
  groupStats?: Array<{ approval_status: string; _count: number }>
  recentUsers?: RecentUser[]
  monthlyTrend?: MonthlyTrend[]
  roleDistribution?: RoleDistribution[]
  topDepartments?: TopDepartment[]
}

const colorClasses: Record<RoleDistribution["color"], string> = {
  emerald: "bg-emerald-500/70",
  sky: "bg-sky-500/70",
  amber: "bg-amber-500/70",
}

const surfaceClasses = {
  blue: "border-sky-500/20 bg-[linear-gradient(135deg,rgba(14,165,233,0.10),rgba(255,255,255,0))]",
  emerald: "border-emerald-500/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(255,255,255,0))]",
  amber: "border-amber-500/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.10),rgba(255,255,255,0))]",
  rose: "border-rose-500/20 bg-[linear-gradient(135deg,rgba(244,63,94,0.10),rgba(255,255,255,0))]",
}

export default function AdminDashboard() {
  const [data, setData] = React.useState<DashboardData | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch("/api/admin/dashboard")
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-[28px] border border-border/60 bg-background/80">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    )
  }

  const stats = data?.stats
  const approvalMap = Object.fromEntries(
    (data?.groupStats || []).map((entry) => [entry.approval_status, entry._count])
  )
  const maxTrendValue = Math.max(
    ...((data?.monthlyTrend || []).flatMap((item) => [item.users, item.groups])),
    1
  )
  const maxDepartmentLoad = Math.max(
    ...((data?.topDepartments || []).map((department) => department.totalPeople)),
    1
  )

  const quickLinks = [
    {
      title: "Departments",
      description: "Maintain academic ownership and structure.",
      href: "/admin/departments",
      icon: Building2,
    },
    {
      title: "Academic Years",
      description: "Set active project cycles and calendar boundaries.",
      href: "/admin/academic-years",
      icon: CalendarRange,
    },
    {
      title: "Faculty",
      description: "Review supervisors, guides, and staff access.",
      href: "/admin/faculty",
      icon: Users,
    },
    {
      title: "Students",
      description: "Track enrollment, activation, and reach.",
      href: "/admin/students",
      icon: GraduationCap,
    },
  ]

  return (
    <AdminPageShell
      title="Administrative overview"
      description="Centralize setup, monitor delivery health, and move into each operational area without leaving the admin workspace."
      metrics={[
        {
          label: "Departments",
          value: stats?.totalDepartments ?? 0,
          hint: "Configured academic units in the platform.",
        },
        {
          label: "Faculty",
          value: stats?.totalFaculty ?? 0,
          hint: "Staff members available for supervision and review.",
        },
        {
          label: "Students",
          value: stats?.totalStudents ?? 0,
          hint: "Registered learners in the current system.",
        },
        {
          label: "Pending approvals",
          value: stats?.pendingProposals ?? 0,
          hint: "Groups waiting for administrative review.",
        },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className={cn("rounded-[28px] shadow-none", surfaceClasses.blue)}>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">
                Growth analytics
              </p>
              <CardTitle className="mt-2 text-2xl">Monthly platform activity</CardTitle>
            </div>
            <Badge variant="outline" className="rounded-full border-sky-500/30 bg-sky-500/10 text-sky-700">
              Last 6 months
            </Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <OverviewStat label="Active accounts" value={stats?.activeUsers ?? 0} tone="sky" />
              <OverviewStat label="Approved groups" value={stats?.approvedGroups ?? 0} tone="emerald" />
              <OverviewStat label="Rejected groups" value={stats?.rejectedGroups ?? 0} tone="rose" />
            </div>
            <div className="space-y-4 rounded-[24px] border border-border/60 bg-background/70 p-5">
              {(data?.monthlyTrend || []).map((item) => (
                <div key={item.key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground">
                      {item.users} users, {item.groups} groups
                    </span>
                  </div>
                  <div className="grid gap-2">
                    <div className="h-2 rounded-full bg-sky-500/10">
                      <div
                        className="h-2 rounded-full bg-sky-500/65"
                        style={{ width: `${(item.users / maxTrendValue) * 100}%` }}
                      />
                    </div>
                    <div className="h-2 rounded-full bg-emerald-500/10">
                      <div
                        className="h-2 rounded-full bg-emerald-500/65"
                        style={{ width: `${(item.groups / maxTrendValue) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500/70" />
                  User registrations
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                  Group creations
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className={cn("rounded-[28px] shadow-none", surfaceClasses.emerald)}>
            <CardHeader>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
                Delivery status
              </p>
              <CardTitle className="mt-2 text-2xl">Approval pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusRow label="Approved groups" value={approvalMap.Approved ?? 0} tone="emerald" />
              <StatusRow label="Pending groups" value={approvalMap.Pending ?? 0} tone="amber" />
              <StatusRow label="Rejected groups" value={approvalMap.Rejected ?? 0} tone="rose" />
              <StatusRow
                label="Active academic year"
                value={stats?.activeAY || "N/A"}
                icon={<ShieldCheck className="h-4 w-4 text-primary" />}
              />
              <StatusRow
                label="Total groups"
                value={stats?.totalGroups ?? 0}
                icon={<FolderKanban className="h-4 w-4 text-primary" />}
              />
            </CardContent>
          </Card>

          <Card className={cn("rounded-[28px] shadow-none", surfaceClasses.amber)}>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">
                  Access mix
                </p>
                <CardTitle className="mt-2 text-2xl">Role distribution</CardTitle>
              </div>
              <Sparkles className="h-5 w-5 text-amber-500/80" />
            </CardHeader>
            <CardContent className="space-y-4">
              {(data?.roleDistribution || []).map((item) => {
                const total = (stats?.totalStudents ?? 0) + (stats?.totalFaculty ?? 0) + ((data?.roleDistribution || []).find((entry) => entry.label === "Admins")?.value ?? 0)
                const width = total > 0 ? (item.value / total) * 100 : 0

                return (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-muted-foreground">{item.value}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-black/5">
                      <div
                        className={cn("h-2.5 rounded-full", colorClasses[item.color])}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className={cn("rounded-[28px] shadow-none", surfaceClasses.blue)}>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">
                Department load
              </p>
              <CardTitle className="mt-2 text-2xl">Coverage by department</CardTitle>
            </div>
            <TrendingUp className="h-5 w-5 text-sky-500/80" />
          </CardHeader>
          <CardContent className="space-y-4">
            {(data?.topDepartments || []).map((department) => (
              <div key={department.department_id} className="space-y-2 rounded-2xl border border-border/50 bg-background/65 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{department.department_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {department.studentCount} students, {department.facultyCount} faculty
                    </p>
                  </div>
                  <Badge variant="outline" className="rounded-full">
                    {department.totalPeople} total
                  </Badge>
                </div>
                <div className="h-2.5 rounded-full bg-sky-500/10">
                  <div
                    className="h-2.5 rounded-full bg-sky-500/65"
                    style={{ width: `${(department.totalPeople / maxDepartmentLoad) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className={cn("rounded-[28px] shadow-none", surfaceClasses.emerald)}>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
                Recent registrations
              </p>
              <CardTitle className="mt-2 text-2xl">Latest user additions</CardTitle>
            </div>
            <Button asChild variant="outline" className="rounded-full bg-background/70">
              <Link href="/admin/faculty">
                Open directories
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {(data?.recentUsers || []).map((user) => {
              const name =
                user.acd_student?.student_name ||
                user.acd_staff?.staff_name ||
                "Administrator"

              return (
                <div
                  key={user.user_id}
                  className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/70 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="rounded-full bg-background/70">
                      {user.role}
                    </Badge>
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickLinks.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-[24px] border p-5 transition-colors hover:border-primary/30",
              index % 4 === 0 && surfaceClasses.blue,
              index % 4 === 1 && surfaceClasses.emerald,
              index % 4 === 2 && surfaceClasses.amber,
              index % 4 === 3 && surfaceClasses.rose
            )}
          >
            <item.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
          </Link>
        ))}
      </div>
    </AdminPageShell>
  )
}

function OverviewStat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "sky" | "emerald" | "rose"
}) {
  const toneClass = {
    sky: "border-sky-500/20 bg-sky-500/10 text-sky-700",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
    rose: "border-rose-500/20 bg-rose-500/10 text-rose-700",
  }[tone]

  return (
    <div className={cn("rounded-2xl border p-4", toneClass)}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em]">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function StatusRow({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
  tone?: "emerald" | "amber" | "rose"
}) {
  const toneClass = tone
    ? {
        emerald: "bg-emerald-500/8 border-emerald-500/20",
        amber: "bg-amber-500/8 border-amber-500/20",
        rose: "bg-rose-500/8 border-rose-500/20",
      }[tone]
    : "bg-background/60"

  return (
    <div className={cn("flex items-center justify-between rounded-2xl border px-4 py-3", toneClass)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  )
}
