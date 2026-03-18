import type { ReactNode } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type FacultyMetric = {
  label: string
  value: ReactNode
  hint: string
  tone?: "sky" | "emerald" | "amber" | "violet"
}

type FacultyPageShellProps = {
  eyebrow?: string
  title: string
  description: string
  metrics?: FacultyMetric[]
  action?: ReactNode
  children: ReactNode
  className?: string
}

const toneClasses = {
  sky: "border-sky-500/20 bg-sky-500/8",
  emerald: "border-emerald-500/20 bg-emerald-500/8",
  amber: "border-amber-500/20 bg-amber-500/8",
  violet: "border-violet-500/20 bg-violet-500/8",
}

export function FacultyPageShell({
  eyebrow = "Faculty workspace",
  title,
  description,
  metrics,
  action,
  children,
  className,
}: FacultyPageShellProps) {
  return (
    <div className={cn("space-y-8", className)}>
      <section className="relative overflow-hidden rounded-[28px] border border-border/60 bg-[linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.45))] p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.08),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.10),transparent_34%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              {eyebrow}
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                {title}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                {description}
              </p>
            </div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>

        {metrics?.length ? (
          <div className="relative mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <Card
                key={metric.label}
                className={cn(
                  "border-border/50 bg-background/80 shadow-none backdrop-blur",
                  metric.tone ? toneClasses[metric.tone] : ""
                )}
              >
                <CardContent className="space-y-2 p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                    {metric.label}
                  </p>
                  <div className="text-2xl font-semibold tracking-tight">
                    {metric.value}
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {metric.hint}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </section>

      {children}
    </div>
  )
}
