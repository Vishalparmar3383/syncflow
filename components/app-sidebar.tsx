"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Award,
  BarChart3,
  Building2,
  Calendar,
  CalendarRange,
  ChevronRight,
  ClipboardCheck,
  Command,
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Settings,
  UserCircle2,
  Users,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/hooks/use-user"

interface NavItem {
  title: string
  url: string
  icon: React.ElementType
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
}

const roleThemes = {
  Admin: {
    brand: "from-sky-500/20 via-cyan-500/10 to-transparent",
    icon: "from-sky-500 to-cyan-500",
    active: "bg-[linear-gradient(135deg,rgba(14,165,233,0.18),rgba(6,182,212,0.08))] text-foreground shadow-[0_12px_30px_rgba(14,165,233,0.14)]",
    badge: "border-sky-500/30 bg-sky-500/12 text-sky-700 dark:text-sky-300",
    footer: "from-sky-500/16 via-cyan-500/8 to-transparent",
  },
  Faculty: {
    brand: "from-emerald-500/20 via-lime-500/10 to-transparent",
    icon: "from-emerald-500 to-lime-500",
    active: "bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(132,204,22,0.08))] text-foreground shadow-[0_12px_30px_rgba(16,185,129,0.14)]",
    badge: "border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    footer: "from-emerald-500/16 via-lime-500/8 to-transparent",
  },
  Student: {
    brand: "from-violet-500/20 via-fuchsia-500/10 to-transparent",
    icon: "from-violet-500 to-fuchsia-500",
    active: "bg-[linear-gradient(135deg,rgba(139,92,246,0.18),rgba(217,70,239,0.08))] text-foreground shadow-[0_12px_30px_rgba(139,92,246,0.14)]",
    badge: "border-violet-500/30 bg-violet-500/12 text-violet-700 dark:text-violet-300",
    footer: "from-violet-500/16 via-fuchsia-500/8 to-transparent",
  },
} as const

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { state } = useSidebar()
  const { userRole, getUserDisplayName, getUserEmail, getInitials } = useUser()
  const theme = userRole ? roleThemes[userRole] : roleThemes.Student

  const getNavItems = (): NavItem[] => {
    if (!userRole) return []

    switch (userRole) {
      case "Admin":
        return [
          { title: "Dashboard", url: "/admin", icon: LayoutDashboard, isActive: pathname === "/admin" },
          {
            title: "Configuration",
            url: "#",
            icon: Building2,
            items: [
              { title: "Departments", url: "/admin/departments" },
              { title: "Academic Years", url: "/admin/academic-years" },
              { title: "Project Types", url: "/admin/project-types" },
            ],
          },
          {
            title: "Users",
            url: "#",
            icon: Users,
            items: [
              { title: "Faculty", url: "/admin/faculty" },
              { title: "Students", url: "/admin/students" },
              { title: "Project Groups", url: "/admin/groups" },
            ],
          },
          { title: "Reports", url: "/admin/reports", icon: BarChart3, isActive: pathname === "/admin/reports" },
          { title: "Profile", url: "/profile", icon: UserCircle2, isActive: pathname === "/profile" },
          { title: "Settings", url: "/settings", icon: Settings, isActive: pathname === "/settings" },
        ]

      case "Faculty":
        return [
          { title: "Dashboard", url: "/faculty", icon: LayoutDashboard, isActive: pathname === "/faculty" },
          { title: "Pending Proposals", url: "/faculty/proposals", icon: ClipboardCheck, isActive: pathname === "/faculty/proposals" },
          { title: "My Groups", url: "/faculty/groups", icon: Users, isActive: pathname === "/faculty/groups" },
          { title: "Meetings", url: "/faculty/meetings", icon: CalendarRange, isActive: pathname === "/faculty/meetings" },
          { title: "Documents", url: "/faculty/documents", icon: FolderKanban, isActive: pathname === "/faculty/documents" },
          { title: "Evaluations", url: "/faculty/evaluations", icon: GraduationCap, isActive: pathname === "/faculty/evaluations" },
          { title: "Profile", url: "/profile", icon: UserCircle2, isActive: pathname === "/profile" },
          { title: "Settings", url: "/settings", icon: Settings, isActive: pathname === "/settings" },
        ]

      case "Student":
        return [
          { title: "Dashboard", url: "/student", icon: LayoutDashboard, isActive: pathname === "/student" },
          { title: "My Group", url: "/student/group", icon: Users, isActive: pathname === "/student/group" },
          { title: "Proposals", url: "/student/proposals", icon: FileText, isActive: pathname === "/student/proposals" },
          { title: "Meetings", url: "/student/meetings", icon: Calendar, isActive: pathname === "/student/meetings" },
          { title: "Documents", url: "/student/documents", icon: FolderKanban, isActive: pathname === "/student/documents" },
          { title: "Evaluations", url: "/student/evaluations", icon: Award, isActive: pathname === "/student/evaluations" },
          { title: "Profile", url: "/profile", icon: UserCircle2, isActive: pathname === "/profile" },
          { title: "Settings", url: "/settings", icon: Settings, isActive: pathname === "/settings" },
        ]

      default:
        return []
    }
  }

  const navItems = getNavItems()
  const isActive = (url: string) => pathname === url

  return (
    <Sidebar collapsible="icon" className="border-r-0" {...props}>
      <SidebarHeader className={`border-b border-sidebar-border/60 bg-gradient-to-br ${theme.brand} px-3 pb-4 pt-3`}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="h-auto rounded-[24px] border border-sidebar-border/60 bg-sidebar/80 px-3 py-3 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl"
            >
              <Link href="/">
                <div className={`flex aspect-square size-10 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.icon} text-white shadow-lg`}>
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold tracking-tight">SyncFlow</span>
                  <span className="truncate text-xs text-sidebar-foreground/65">Project Management</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="bg-[linear-gradient(180deg,transparent_0%,hsl(var(--sidebar-primary)/0.04)_100%)] px-2 pb-2 pt-3">
        <SidebarGroup className="gap-3 p-0">
          <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/45">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {navItems.map((item) => {
                if (item.items && item.items.length > 0 && state === "collapsed") {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.title}
                            isActive={isActive(item.url) || item.isActive}
                            className="rounded-2xl border border-transparent px-3 py-2 text-sidebar-foreground/78 hover:border-sidebar-border/60 hover:bg-sidebar-accent/70 data-[active=true]:border-transparent"
                          >
                            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${isActive(item.url) || item.isActive ? theme.active : "bg-sidebar-accent/65 text-sidebar-foreground/75"}`}>
                              <item.icon className="h-4 w-4" />
                            </div>
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto hidden h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start" sideOffset={4}>
                          <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {item.items.map((subItem) => (
                            <DropdownMenuItem key={subItem.title} asChild>
                              <Link href={subItem.url} className="w-full">
                                {subItem.title}
                              </Link>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  )
                }

                if (item.items && item.items.length > 0) {
                  return (
                    <Collapsible
                      key={item.title}
                      asChild
                      defaultOpen={item.isActive || item.items.some((subItem) => isActive(subItem.url))}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.title}
                            isActive={isActive(item.url) || item.isActive}
                            className="rounded-2xl border border-transparent px-3 py-2 text-sidebar-foreground/78 hover:border-sidebar-border/60 hover:bg-sidebar-accent/70 data-[active=true]:border-transparent"
                          >
                            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${item.items.some((subItem) => isActive(subItem.url)) ? theme.active : "bg-sidebar-accent/65 text-sidebar-foreground/75"}`}>
                              <item.icon className="h-4 w-4" />
                            </div>
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub className="ml-[1.1rem] mt-2 gap-2 border-l-sidebar-border/70">
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild isActive={isActive(subItem.url)} className="rounded-xl px-3 hover:bg-sidebar-accent/75 data-[active=true]:bg-sidebar-accent/85">
                                  <Link href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                      className="rounded-2xl border border-transparent px-3 py-2 text-sidebar-foreground/78 hover:border-sidebar-border/60 hover:bg-sidebar-accent/70 data-[active=true]:border-transparent"
                    >
                      <Link href={item.url}>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${isActive(item.url) ? theme.active : "bg-sidebar-accent/65 text-sidebar-foreground/75"}`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60 px-3 pb-3 pt-2">
        <SidebarSeparator />
        <div className={`rounded-[24px] border border-sidebar-border/60 bg-gradient-to-br ${theme.footer} p-3 shadow-[0_14px_34px_rgba(15,23,42,0.06)] group-data-[collapsible=icon]:hidden`}>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-sidebar/80 p-3 backdrop-blur-xl">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">{getUserDisplayName()}</p>
              <p className="truncate text-xs text-sidebar-foreground/65">{getUserEmail()}</p>
            </div>
            <div className={`flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-gradient-to-br ${theme.icon} text-white shadow-lg`}>
              <span className="text-xs font-semibold">{getInitials()}</span>
            </div>
          </div>
          {userRole ? (
            <Badge variant="outline" className={`mt-3 border ${theme.badge} shadow-none`}>
              {userRole}
            </Badge>
          ) : null}
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
