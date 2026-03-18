"use client"

import * as React from "react"
import { BarChart3, Loader2 } from "lucide-react"

import { AdminPageShell } from "@/components/admin/admin-page-shell"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type ReportSummary = {
  summary?: {
    studentCount: number
    staffCount: number
    groupCount: number
    activeGroups: number
  }
}

type ProjectReportRow = {
  id: number
  title: string
  type: string
  guide: string
  members: string
  status: string
}

export default function AdminReportsPage() {
  const [summary, setSummary] = React.useState<ReportSummary | null>(null)
  const [projects, setProjects] = React.useState<ProjectReportRow[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchReports = async () => {
      try {
        const [summaryResponse, projectsResponse] = await Promise.all([
          fetch("/api/reports/dashboard"),
          fetch("/api/reports/projects"),
        ])

        const [summaryData, projectsData] = await Promise.all([
          summaryResponse.json(),
          projectsResponse.json(),
        ])

        setSummary(summaryData)
        setProjects(Array.isArray(projectsData) ? projectsData : [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-[28px] border border-border/60 bg-background/90">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <AdminPageShell
      title="Operational reports"
      description="Review the current platform footprint and inspect project delivery data from one reporting surface."
      metrics={[
        {
          label: "Students",
          value: summary?.summary?.studentCount ?? 0,
          hint: "Reported by the admin dashboard endpoint.",
        },
        {
          label: "Faculty",
          value: summary?.summary?.staffCount ?? 0,
          hint: "Staff users represented in the reporting layer.",
        },
        {
          label: "Groups",
          value: summary?.summary?.groupCount ?? 0,
          hint: "Project teams currently tracked.",
        },
        {
          label: "Active groups",
          value: summary?.summary?.activeGroups ?? 0,
          hint: "Teams still running in an active state.",
        },
      ]}
    >
      <Card className="rounded-[28px] border-rose-500/20 bg-[linear-gradient(135deg,rgba(244,63,94,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
        <CardContent className="space-y-6 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-rose-500/10 p-3 text-rose-700">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Project report</h2>
              <p className="text-sm text-muted-foreground">
                Snapshot of tracked projects from the reporting API.
              </p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Guide</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.title}</TableCell>
                  <TableCell>{project.type}</TableCell>
                  <TableCell>{project.guide}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {project.members}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-full">
                      {project.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminPageShell>
  )
}
