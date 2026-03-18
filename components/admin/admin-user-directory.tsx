"use client"

import * as React from "react"
import { Mail, Loader2, Search, ShieldCheck, UserCheck } from "lucide-react"

import { AdminPageShell } from "@/components/admin/admin-page-shell"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

type Role = "Faculty" | "Student"

type DirectoryUser = {
  staff_id?: number
  student_id?: number
  staff_name?: string
  student_name?: string
  email: string
  designation?: string | null
  enrollment_number?: string | null
  acd_department?: {
    department_name?: string | null
  } | null
  acd_user?: {
    is_active?: boolean | null
  } | null
}

type AdminUserDirectoryProps = {
  role: Role
  title: string
  description: string
}

export function AdminUserDirectory({
  role,
  title,
  description,
}: AdminUserDirectoryProps) {
  const [users, setUsers] = React.useState<DirectoryUser[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)

      try {
        const response = await fetch(`/api/admin/users?role=${role}`)
        const data = await response.json()
        setUsers(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error(error)
        setUsers([])
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [role])

  const filteredUsers = users.filter((user) => {
    const name = (user.student_name || user.staff_name || "").toLowerCase()
    const email = (user.email || "").toLowerCase()
    const query = searchQuery.toLowerCase()

    return name.includes(query) || email.includes(query)
  })

  const activeCount = users.filter((user) => user.acd_user?.is_active).length

  return (
    <AdminPageShell
      title={title}
      description={description}
      metrics={[
        {
          label: `${role} records`,
          value: users.length,
          hint: "Directory entries available to administrators.",
        },
        {
          label: "Active access",
          value: activeCount,
          hint: "Accounts that can currently sign in.",
        },
        {
          label: "Departments",
          value: new Set(users.map((user) => user.acd_department?.department_name).filter(Boolean)).size,
          hint: "Academic units represented in this list.",
        },
        {
          label: "Search results",
          value: filteredUsers.length,
          hint: "Records matching the current filter.",
        },
      ]}
      action={
        <div className="relative w-full min-w-[280px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={`Search ${role.toLowerCase()} by name or email`}
            className="h-11 rounded-xl border-border/60 bg-background/90 pl-9"
          />
        </div>
      }
    >
      <Card className="rounded-[24px] border-sky-500/20 bg-[linear-gradient(135deg,rgba(14,165,233,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[340px]">Profile</TableHead>
                  <TableHead>{role === "Faculty" ? "Designation" : "Enrollment"}</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const name = user.staff_name || user.student_name

                  return (
                    <TableRow key={user.staff_id || user.student_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-11 w-11 border border-sky-500/20">
                            <AvatarFallback className="bg-sky-500/10 text-sky-700">
                              {name
                                ?.split(" ")
                                .map((part: string) => part[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <div className="font-medium">{name}</div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.designation || user.enrollment_number || "Unassigned"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-full border-emerald-500/30 bg-emerald-500/10 text-emerald-700">
                          {user.acd_department?.department_name || "No department"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "h-2.5 w-2.5 rounded-full",
                              user.acd_user?.is_active ? "bg-emerald-500" : "bg-slate-300"
                            )}
                          />
                          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                            {user.acd_user?.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {!filteredUsers.length ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-sm text-muted-foreground">
                        {role === "Faculty" ? (
                          <ShieldCheck className="h-6 w-6 text-primary" />
                        ) : (
                          <UserCheck className="h-6 w-6 text-primary" />
                        )}
                        No matching records found.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminPageShell>
  )
}
