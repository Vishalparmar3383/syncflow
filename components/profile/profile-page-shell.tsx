"use client"

import { cn } from "@/lib/utils"

interface ProfilePageShellProps {
  title: string
  description: string
  accent?: "sky" | "emerald" | "amber" | "rose"
  children: React.ReactNode
}

const accentClasses = {
  sky: "from-sky-500/18 via-cyan-500/8 to-transparent",
  emerald: "from-emerald-500/18 via-lime-500/8 to-transparent",
  amber: "from-amber-500/18 via-orange-500/8 to-transparent",
  rose: "from-rose-500/18 via-fuchsia-500/8 to-transparent",
}

export function ProfilePageShell({
  title,
  description,
  accent = "sky",
  children,
}: ProfilePageShellProps) {
  return (
    <div className="space-y-6">
      <section
        className={cn(
          "relative overflow-hidden rounded-[28px] border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-xl",
          "before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-100",
          accentClasses[accent]
        )}
      >
        <div className="relative space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/75">Account workspace</p>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </section>
      {children}
    </div>
  )
}
