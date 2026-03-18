"use client"

import React from "react"
import { motion } from "framer-motion"
import { Star, Quote } from "lucide-react"

const testimonials = [
    {
        quote: "This system revolutionized how we manage our final year projects. The proposal submission and tracking is seamless.",
        name: "Alex Johnson",
        title: "Computer Science Student",
        image: "https://i.pravatar.cc/150?u=alex",
    },
    {
        quote: "As a guide, I can easily track all my student groups and their progress. It saves me so much time.",
        name: "Prof. Sarah Williams",
        title: "Project Guide",
        image: "https://i.pravatar.cc/150?u=sarah",
    },
    {
        quote: "The interface is beautiful and easy to use. I love the dark mode!",
        name: "Michael Chen",
        title: "IT Student",
        image: "https://i.pravatar.cc/150?u=michael",
    },
]

export function Testimonials() {
    return (
        <section className="py-24 bg-muted/30">
            <div className="container px-4 mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Trusted by Students & Faculty</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        See how SyncFlow is transforming project management in academic institutions.
                    </p>
                </div>
                <div className="grid gap-8 md:grid-cols-3">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={t.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="p-8 rounded-2xl bg-background border hover:shadow-xl transition-all relative overflow-hidden group"
                        >
                            <Quote className="absolute top-4 right-4 w-12 h-12 text-primary/5 group-hover:text-primary/10 transition-colors" />
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                                ))}
                            </div>
                            <p className="text-muted-foreground mb-8 relative z-10 italic">
                                &quot;{t.quote}&quot;
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">
                                    <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="font-bold">{t.name}</h4>
                                    <p className="text-sm text-muted-foreground">{t.title}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
