"use client"

import { motion } from "framer-motion"
import {
    UserPlus,
    FileText,
    CheckCircle,
    ClipboardCheck,
    GraduationCap
} from "lucide-react"

const steps = [
    {
        title: "Create Group",
        description: "Form a team with your peers and register your group on the platform.",
        icon: UserPlus,
    },
    {
        title: "Submit Proposal",
        description: "Outline your project scope and submit it for academic approval.",
        icon: FileText,
    },
    {
        title: "Faculty Approval",
        description: "Your assigned guide reviews and approves your project direction.",
        icon: CheckCircle,
    },
    {
        title: "Track Progress",
        description: "Log regular meetings, submit reports, and track milestones.",
        icon: ClipboardCheck,
    },
    {
        title: "Evaluation",
        description: "Complete your project and get evaluated by faculty experts.",
        icon: GraduationCap,
    },
]

export function HowItWorks() {
    return (
        <section className="py-24 bg-background overflow-hidden">
            <div className="container px-4 mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <h2 className="text-3xl font-bold tracking-tight md:text-5xl mb-4">
                        How SyncFlow <span className="text-primary">Works</span>
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        A simple, structured process to take your academic projects from concept to completion.
                    </p>
                </motion.div>

                <div className="grid gap-8 lg:grid-cols-5 relative">
                    {/* Connection line for desktop */}
                    <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-y-1/2" />

                    {steps.map((step, index) => (
                        <motion.div
                            key={step.title}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="relative flex flex-col items-center text-center group"
                        >
                            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mb-6 relative z-10 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                                <step.icon className="w-8 h-8" />
                                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center border-2 border-background">
                                    {index + 1}
                                </div>
                            </div>
                            <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{step.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
