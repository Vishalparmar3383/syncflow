"use client"

import * as React from "react"
import { FolderKanban, Loader2, Search } from "lucide-react"

import { FacultyPageShell } from "@/components/faculty/faculty-page-shell"
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

type Group = {
  project_group_id: number
  project_group_name: string
  project_title: string
  group_status?: string | null
  approval_status?: string | null
  acd_project_type?: { project_type_name?: string | null } | null
  acd_project_group_member?: Array<{ project_group_member_id: number }>
}

export default function FacultyGroupsPage() {
  const [groups, setGroups] = React.useState<Group[]>([])
  const [loading, setLoading] = React.useState(true)
  const [query, setQuery] = React.useState("")

  React.useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch("/api/groups")
        const result = await response.json()
        setGroups(Array.isArray(result) ? result : [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchGroups()
  }, [])

  const filtered = groups.filter((group) => {
    const search = query.toLowerCase()
    return (
      group.project_group_name?.toLowerCase().includes(search) ||
      group.project_title?.toLowerCase().includes(search)
    )
  })

  return (
    <FacultyPageShell
      title="My groups"
      description="See the project teams connected to your guide, convener, or expert roles."
      metrics={[
        {
          label: "Groups",
          value: groups.length,
          hint: "Total groups in your faculty scope.",
          tone: "sky",
        },
        {
          label: "Pending approvals",
          value: groups.filter((group) => group.approval_status === "Pending").length,
          hint: "Teams still awaiting decision.",
          tone: "amber",
        },
      ]}
      action={
        <div className="relative min-w-[280px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search groups"
            className="h-11 rounded-xl pl-9"
          />
        </div>
      }
    >
      <Card className="rounded-[28px] border-sky-500/20 bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
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
                  <TableHead>Type</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approval</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((group) => (
                  <TableRow key={group.project_group_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-primary/10 p-2 text-primary">
                          <FolderKanban className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{group.project_group_name}</p>
                          <p className="text-sm text-muted-foreground">{group.project_title}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{group.acd_project_type?.project_type_name || "General"}</TableCell>
                    <TableCell>{group.acd_project_group_member?.length || 0}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-full">
                        {group.group_status || "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="rounded-full bg-emerald-600">
                        {group.approval_status || "Pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </FacultyPageShell>
  )
}
