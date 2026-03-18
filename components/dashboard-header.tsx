"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Calendar, ExternalLink, LogOut, MessageSquare, Settings, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useUser } from "@/hooks/use-user"
import { ModeToggle } from "@/components/mode-toggle"

export function DashboardHeader() {
  const pathname = usePathname()
  const { userRole, getUserDisplayName, getUserEmail, getInitials, logout } = useUser()
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false)
  const [headerSummary, setHeaderSummary] = React.useState<{
    meetings: Array<{ title: string; subtitle: string; href: string }>
    notifications: Array<{ title: string; subtitle: string; href: string }>
  }>({ meetings: [], notifications: [] })
  const roleLabel = userRole ? `${userRole} workspace` : "Workspace"
  const meetingsHref = userRole === "Faculty" ? "/faculty/meetings" : userRole === "Student" ? "/student/meetings" : "/admin/groups"
  const quickLinks =
    userRole === "Faculty"
      ? [
          { label: "Pending proposals", href: "/faculty/proposals" },
          { label: "Evaluations", href: "/faculty/evaluations" },
          { label: "Groups", href: "/faculty/groups" },
        ]
      : userRole === "Student"
        ? [
            { label: "My group", href: "/student/group" },
            { label: "Proposals", href: "/student/proposals" },
            { label: "Documents", href: "/student/documents" },
          ]
        : [
            { label: "Departments", href: "/admin/departments" },
            { label: "Groups", href: "/admin/groups" },
            { label: "Reports", href: "/admin/reports" },
          ]

  React.useEffect(() => {
    const loadHeaderSummary = async () => {
      try {
        const response = await fetch("/api/header/summary")
        const data = await response.json()
        if (response.ok) {
          setHeaderSummary({
            meetings: Array.isArray(data.meetings) ? data.meetings : [],
            notifications: Array.isArray(data.notifications) ? data.notifications : [],
          })
        }
      } catch (error) {
        console.error("Failed to load header summary:", error)
      }
    }

    loadHeaderSummary()
  }, [])

  return (
    <div className="flex flex-1 items-center justify-between gap-4">
      <div className="ml-auto flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Calendar className="h-5 w-5" />
              <span className="sr-only">Calendar</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end">
            <DropdownMenuLabel>Upcoming schedule</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {headerSummary.meetings.length ? (
              headerSummary.meetings.map((meeting) => (
                <DropdownMenuItem key={`${meeting.href}-${meeting.title}`} asChild>
                  <Link href={meeting.href} className="flex flex-col items-start gap-1 py-2">
                    <span className="font-medium">{meeting.title}</span>
                    <span className="text-xs text-muted-foreground">{meeting.subtitle}</span>
                  </Link>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem asChild>
                <Link href={meetingsHref}>Open schedule</Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <MessageSquare className="h-5 w-5" />
              <span className="sr-only">Messages</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72" align="end">
            <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {quickLinks.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href}>
                  {item.label}
                  <ExternalLink className="ml-auto h-4 w-4" />
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="h-5 w-5" />
              {headerSummary.notifications.length ? (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-background bg-red-600" />
              ) : null}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {headerSummary.notifications.length ? (
              headerSummary.notifications.map((notification) => (
                <DropdownMenuItem key={`${notification.href}-${notification.title}`} asChild>
                  <Link href={notification.href} className="flex flex-col items-start gap-1 py-2">
                    <span className="font-medium">{notification.title}</span>
                    <span className="text-xs text-muted-foreground">{notification.subtitle}</span>
                  </Link>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem>No new notifications</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <ModeToggle />

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-2">
          <div className="mr-2 hidden md:flex flex-col items-end">
            <span className="text-sm font-semibold">{getUserDisplayName()}</span>
            <span className="text-xs text-muted-foreground">{roleLabel}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${getUserDisplayName()}`} alt={getUserDisplayName()} />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
                  <p className="text-xs leading-none text-muted-foreground">{getUserEmail()}</p>
                  <p className="text-xs leading-none text-muted-foreground">{pathname}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setShowLogoutDialog(true)}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to logout?</DialogTitle>
            <DialogDescription>You will need to login again to access your dashboard.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
              No
            </Button>
            <Button variant="destructive" onClick={logout}>
              Yes, Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
