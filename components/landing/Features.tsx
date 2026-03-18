"use client"

import React from "react";
import { motion } from "framer-motion"
import {
    Users,
    FileCheck,
    Calendar,
    BarChart3,
    ShieldCheck,
    Zap
} from "lucide-react"

const features = [
    {
        title: "Role-Based Access",
        description: "Tailored experiences for Students, Faculty, and Administrators with secure access control.",
        icon: ShieldCheck,
    },
    {
        title: "Project Tracking",
        description: "Monitor project milestones, document submissions, and approval workflows in real-time.",
        icon: BarChart3,
    },
    {
        title: "Meeting Management",
        description: "Schedule meetings, track attendance, and log minutes effectively.",
        icon: Calendar,
    },
    {
        title: "Smart Evaluations",
        description: "Structured evaluation process with customizable criteria and instant feedback.",
        icon: FileCheck,
    },
    {
        title: "Team Collaboration",
        description: "Seamless communication and group management for student project teams.",
        icon: Users,
    },
    {
        title: "Instant Analytics",
        description: "Comprehensive dashboards providing insights into institutional project progress.",
        icon: Zap,
    },
]

export function Features() {
    return (
        <section className="py-24 bg-muted/30">
            <div className="container px-4 mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl font-bold tracking-tight md:text-5xl mb-4"
                    >
                        Everything you need to <span className="text-primary">manage academic projects</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-lg text-muted-foreground"
                    >
                        Our comprehensive platform simplifies the complex workflow of academic projects, ensuring transparency and accountability.
                    </motion.p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="relative p-8 rounded-2xl border bg-card hover:shadow-lg transition-all duration-300 group overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 -mr-4 -mt-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <feature.icon className="w-24 h-24" />
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                            <p className="text-muted-foreground">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

const Skeleton = () => (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 shrink-0 flex-col gap-2">
        <div className="w-1/3 h-4 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
        <div className="w-full h-4 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
        <div className="w-5/6 h-4 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
        <div className="w-1/2 h-8 bg-neutral-200 dark:bg-neutral-800 rounded-md mt-auto" />
    </div>
);

const items = [
    {
        title: "Create Group",
        description: "Form project groups easily with your classmates.",
        header: <Skeleton />,
    },
    {
        title: "Submit Proposal",
        description: "Submit your project proposals for approval.",
        header: <Skeleton />,
    },
    {
        title: "Guide Approval",
        description: "Get approved by your project guide seamlessly.",
        header: <Skeleton />,
    },
    {
        title: "Meetings & Tracking",
        description:
            "Schedule meetings and track your project progress with detailed logs.",
        header: <Skeleton />,
    },
    {
        title: "Reports & Evaluation",
        description: "Generate reports and get evaluated on your performance.",
        header: <Skeleton />,
    },
];
