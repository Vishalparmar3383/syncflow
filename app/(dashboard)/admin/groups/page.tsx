"use client"

import * as React from "react"
import { FolderKanban, Loader2, Search } from "lucide-react"

import { AdminPageShell } from "@/components/admin/admin-page-shell"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type ProjectGroup = {
  project_group_id: number
  project_group_name: string
  project_title: string
  approval_status?: "Approved" | "Pending" | "Rejected" | null
  acd_project_type?: { project_type_name?: string | null } | null
  acd_academic_year?: { academic_year_code?: string | null } | null
  acd_staff_acd_project_group_guide_staff_idToacd_staff?: {
    staff_name?: string | null
  } | null
}

export default function AdminGroupsPage() {
  const [groups, setGroups] = React.useState<ProjectGroup[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch("/api/admin/groups")
        const data = await response.json()
        setGroups(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error(error)
        setGroups([])
      } finally {
        setLoading(false)
      }
    }

    fetchGroups()
  }, [])

  const filtered = groups.filter((group) => {
    const query = searchQuery.toLowerCase()

    return (
      group.project_group_name?.toLowerCase().includes(query) ||
      group.project_title?.toLowerCase().includes(query)
    )
  })

  return (
    <AdminPageShell
      title="Project group supervision"
      description="Track every project team, review approval states, and keep academic ownership visible at the group level."
      metrics={[
        {
          label: "Groups",
          value: groups.length,
          hint: "Project teams currently stored in the system.",
        },
        {
          label: "Pending review",
          value: groups.filter((group) => group.approval_status === "Pending").length,
          hint: "Teams waiting for administrative approval.",
        },
        {
          label: "Approved",
          value: groups.filter((group) => group.approval_status === "Approved").length,
          hint: "Teams cleared to proceed.",
        },
      ]}
      action={
        <div className="relative w-full min-w-[280px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by group or project title"
            className="h-11 rounded-xl pl-9"
          />
        </div>
      }
    >
      <Card className="rounded-[28px] border-violet-500/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group</TableHead>
                  <TableHead>Guide</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Academic year</TableHead>
                  <TableHead>Approval</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((group) => (
                  <TableRow key={group.project_group_id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-violet-500/10 p-2 text-violet-700">
                            <FolderKanban className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{group.project_group_name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{group.project_title}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {group.acd_staff_acd_project_group_guide_staff_idToacd_staff?.staff_name ||
                        "Unassigned"}
                    </TableCell>
                    <TableCell>{group.acd_project_type?.project_type_name}</TableCell>
                    <TableCell>{group.acd_academic_year?.academic_year_code}</TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "rounded-full",
                          group.approval_status === "Approved" && "bg-emerald-600",
                          group.approval_status === "Rejected" && "bg-destructive",
                          group.approval_status === "Pending" && "bg-amber-500 text-black"
                        )}
                      >
                        {group.approval_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminPageShell>
  )
}
