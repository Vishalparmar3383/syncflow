"use client"

import Link from "next/link"
import { LayoutDashboard, Github, Twitter, Linkedin } from "lucide-react"

export function Footer() {
    return (
        <footer className="bg-muted/30 border-t border-border/40">
            <div className="container px-4 py-12 mx-auto">
                <div className="grid gap-8 md:grid-cols-4">
                    <div className="col-span-2">
                        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter text-foreground mb-4">
                            <LayoutDashboard className="w-6 h-6 text-primary" />
                            SyncFlow
                        </Link>
                        <p className="max-w-xs text-sm text-muted-foreground leading-relaxed">
                            Empowering academic institutions with a centralized platform for project management, collaboration, and evaluation.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Platform</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
                            <li><Link href="/features" className="hover:text-primary transition-colors">Features</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Connect</h4>
                        <div className="flex gap-4">
                            <Link href="#" className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                                <Github className="w-4 h-4" />
                            </Link>
                            <Link href="#" className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                                <Twitter className="w-4 h-4" />
                            </Link>
                            <Link href="#" className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                                <Linkedin className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
                    <p>© {new Date().getFullYear()} SyncFlow. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}
