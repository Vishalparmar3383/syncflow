"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"
import { Zap } from "lucide-react"

export function CTA() {
    return (
        <section className="py-24">
            <div className="container px-4 mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground md:px-16"
                >
                    {/* Background effects */}
                    <div className="absolute left-0 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute right-0 bottom-0 h-64 w-64 translate-x-1/2 translate-y-1/2 rounded-full bg-black/10 blur-3xl" />

                    <div className="relative z-10 mx-auto max-w-2xl">
                        <div className="mb-6 flex justify-center">
                            <div className="rounded-full bg-white/20 p-3">
                                <Zap className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <h2 className="mb-4 text-3xl font-bold md:text-5xl">
                            Ready to streamline your projects?
                        </h2>
                        <p className="mb-10 text-lg opacity-90">
                            Join institutional groups and experience structured academic project management today.
                        </p>
                        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Button asChild size="lg" variant="secondary" className="h-12 px-8 font-bold">
                                <Link href="/login">Get Started Now</Link>
                            </Button>
                            <Button asChild size="lg" variant="outline" className="h-12 px-8 bg-transparent text-white border-white/30 hover:bg-white/10">
                                <Link href="/contact">Contact Sales</Link>
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
