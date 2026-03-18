import type { ReactNode } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type AdminMetric = {
  label: string
  value: ReactNode
  hint: string
}

type AdminPageShellProps = {
  eyebrow?: string
  title: string
  description: string
  metrics?: AdminMetric[]
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function AdminPageShell({
  eyebrow = "Admin workspace",
  title,
  description,
  metrics,
  action,
  children,
  className,
}: AdminPageShellProps) {
  return (
    <div className={cn("space-y-8", className)}>
      <section className="relative overflow-hidden rounded-[28px] border border-border/60 bg-[linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.45))] p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(249,115,22,0.1),_transparent_32%)]" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative max-w-3xl space-y-3">
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
          {action ? <div className="relative shrink-0">{action}</div> : null}
        </div>

        {metrics?.length ? (
          <div className="relative mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <Card
                key={metric.label}
                className="border-border/50 bg-background/80 shadow-none backdrop-blur"
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
