"use client"

import React from "react"
import { motion } from "framer-motion"
import { Laptop, LayoutDashboard } from "lucide-react"

export function SystemPreview() {
    return (
        <section className="py-24 overflow-hidden">
            <div className="container px-4 mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">A Modern Workspace</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Experience an intuitive dashboard designed for maximum productivity and clarity.
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="relative mx-auto max-w-5xl"
                >
                    {/* Mac-style window decor */}
                    <div className="relative aspect-video rounded-2xl border bg-card shadow-2xl overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-10 border-b bg-muted/50 flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-amber-400" />
                            <div className="w-3 h-3 rounded-full bg-emerald-400" />
                            <div className="ml-4 flex items-center gap-2 text-xs text-muted-foreground">
                                <LayoutDashboard className="w-3 h-3" />
                                <span>SyncFlow Dashboard</span>
                            </div>
                        </div>

                        <div className="absolute inset-0 pt-10 flex items-center justify-center">
                            <div className="text-center p-8">
                                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <Laptop className="w-10 h-10 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Interactive Preview</h3>
                                <p className="text-muted-foreground">
                                    The dashboard provides real-time updates on project milestones, <br />
                                    upcoming meetings, and evaluation statuses.
                                </p>
                            </div>

                            {/* Decorative elements to look like a UI */}
                            <div className="absolute top-16 left-8 w-48 h-32 rounded-xl border bg-background/50 blur-[2px]" />
                            <div className="absolute bottom-12 right-8 w-64 h-48 rounded-xl border bg-background/50 blur-[1px]" />
                        </div>

                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none" />
                    </div>

                    {/* Shadow effect */}
                    <div className="absolute -inset-4 bg-primary/5 rounded-[40px] -z-10 blur-3xl opacity-50" />
                </motion.div>
            </div>
        </section>
    )
}
