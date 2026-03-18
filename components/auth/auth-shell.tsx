"use client"

import Link from "next/link"
import { LayoutDashboard } from "lucide-react"

interface AuthShellProps {
  children: React.ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-svh overflow-hidden bg-background">
      <div className="absolute inset-0">
        <div className="absolute left-[-8%] top-[-8%] h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute right-[-10%] top-[18%] h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-[-12%] left-[12%] h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-[6%] right-[14%] h-72 w-72 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,hsl(var(--foreground)/0.02)_50%,transparent_100%)]" />
      </div>

      <div className="relative z-10 flex w-full items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-2xl space-y-8">
          <div className="flex justify-center">
            <Link href="/" className="inline-flex items-center gap-3 text-foreground transition-colors hover:text-primary">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">SyncFlow</p>
                <p className="text-sm text-muted-foreground">Project management workspace</p>
              </div>
            </Link>
          </div>
          <div>{children}</div>
        </div>
      </div>
    </div>
  )
}
