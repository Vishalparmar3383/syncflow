"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

export function Hero() {
    return (
        <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background pt-20">
            {/* Background Glows */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-[128px]" />
                <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-[128px]" />
            </div>

            <div className="container relative z-10 px-4 md:px-6">
                <div className="flex flex-col items-center space-y-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                    >
                        <Sparkles className="h-4 w-4" />
                        <span>The Future of Project Management</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none"
                    >
                        Manage Student Projects with <br />
                        <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                            Precision and Clarity
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-2xl/relaxed"
                    >
                        A unified digital ecosystem for students, faculty, and administrators to collaborate, track, and evaluate academic projects seamlessly.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col gap-4 min-[400px]:flex-row"
                    >
                        <Button asChild size="lg" className="h-12 px-8 text-base font-semibold group bg-primary hover:bg-primary/90">
                            <Link href="/login" className="flex items-center gap-2">
                                Get Started
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base font-semibold">
                            <Link href="/about">Learn More</Link>
                        </Button>
                    </motion.div>
                </div>
            </div>

            {/* Decorative Wave/Gradient at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
        </section>
    )
}
