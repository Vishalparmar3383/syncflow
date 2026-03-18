import type { ComponentType } from "react"

import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarRange,
  FolderKanban,
  LayoutDashboard,
  GraduationCap,
  Users,
} from "lucide-react"

export type AdminNavItem = {
  title: string
  href: string
  icon: ComponentType<{ className?: string }>
  description: string
}

export const adminNavItems: AdminNavItem[] = [
  {
    title: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
    description: "System health and recent activity",
  },
  {
    title: "Departments",
    href: "/admin/departments",
    icon: Building2,
    description: "Academic structure and ownership",
  },
  {
    title: "Academic Years",
    href: "/admin/academic-years",
    icon: CalendarRange,
    description: "Session windows and active cycles",
  },
  {
    title: "Project Types",
    href: "/admin/project-types",
    icon: BookOpen,
    description: "Categories and evaluation tracks",
  },
  {
    title: "Faculty",
    href: "/admin/faculty",
    icon: Users,
    description: "Supervisors, guides, and access",
  },
  {
    title: "Students",
    href: "/admin/students",
    icon: GraduationCap,
    description: "Enrollment and participation status",
  },
  {
    title: "Groups",
    href: "/admin/groups",
    icon: FolderKanban,
    description: "Project teams and approval state",
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
    description: "Operational trends and exports",
  },
]
