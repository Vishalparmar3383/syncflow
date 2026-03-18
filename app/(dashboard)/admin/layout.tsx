import type { ReactNode } from "react"

import { AdminSectionNav } from "@/components/admin/admin-section-nav"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-border/60 bg-[linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.4))] p-4 shadow-sm">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.10),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.10),transparent_30%),radial-gradient(circle_at_center,rgba(245,158,11,0.07),transparent_35%)]" />
        <div className="mb-4">
          <p className="relative text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            Admin routing
          </p>
          <h2 className="relative mt-2 text-xl font-semibold tracking-tight">
            Navigate every administrative area from one place
          </h2>
        </div>
        <AdminSectionNav />
      </section>
      {children}
    </div>
  )
}
