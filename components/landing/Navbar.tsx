"use client"

import * as React from "react"
import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { cn } from "@/lib/utils"
import { LayoutDashboard } from "lucide-react"

export function Navbar() {
    return (
        <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter text-foreground">
                        <LayoutDashboard className="w-6 h-6 text-primary" />
                        SyncFlow
                    </Link>
                </div>
                <div className="hidden md:flex items-center gap-6">
                    <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        Home
                    </Link>
                    <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        About Us
                    </Link>
                    <Link href="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        Contact Us
                    </Link>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/login" className="text-sm font-medium text-foreground hover:text-foreground/80 transition-colors">
                        Login
                    </Link>
                    <ModeToggle />
                </div>
            </div>
        </nav>
    )
}
