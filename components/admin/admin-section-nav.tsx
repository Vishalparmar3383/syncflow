"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { adminNavItems } from "@/components/admin/admin-nav"
import { cn } from "@/lib/utils"

export function AdminSectionNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === href
    }

    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <div className="pb-2">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {adminNavItems.map((item) => {
          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group min-w-0 rounded-2xl border px-4 py-3 transition-all",
                active
                  ? "border-primary/40 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "border-border/60 bg-background/70 text-foreground hover:border-primary/30 hover:bg-background"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 rounded-xl p-2",
                    active
                      ? "bg-primary-foreground/15"
                      : "bg-primary/10 text-primary group-hover:bg-primary/15"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p
                    className={cn(
                      "text-xs leading-5",
                      active ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
