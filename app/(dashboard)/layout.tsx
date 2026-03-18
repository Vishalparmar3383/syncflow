"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/")

  return (
    <SidebarProvider>
      {!isAdminRoute ? <AppSidebar /> : null}
      <SidebarInset className={cn(isAdminRoute && "ml-0 md:ml-0")}>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          {!isAdminRoute ? (
            <>
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
            </>
          ) : null}
          <DashboardHeader />
        </header>
        <main className={cn("flex flex-1 flex-col gap-4 p-4", isAdminRoute && "mx-auto w-full max-w-7xl px-4 py-6 md:px-6")}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
