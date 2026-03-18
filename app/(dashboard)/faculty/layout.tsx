import type { ReactNode } from "react"

export default function FacultyLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-7xl space-y-6">{children}</div>
}
