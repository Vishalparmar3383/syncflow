"use client"

import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { motion } from "framer-motion"
import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function ContactPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden text-center">
                <div className="container px-4 mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-sm font-medium rounded-full bg-primary/10 border border-primary/20 text-primary">
                            <MessageSquare className="w-4 h-4" />
                            <span>We&apos;re here to help</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">Get in <span className="text-primary">Touch</span></h1>
                        <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
                            Have questions about SyncFlow? Our team is ready to assist you with any inquiries regarding deployment or features.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-24">
                <div className="container px-4 mx-auto">
                    <div className="grid gap-16 lg:grid-cols-2">
                        {/* Contact Info */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <h2 className="text-2xl font-bold mb-8">Contact Information</h2>
                            <div className="space-y-8">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold mb-1">Email Us</h3>
                                        <p className="text-muted-foreground">support@syncflow.edu</p>
                                        <p className="text-muted-foreground">info@syncflow.edu</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold mb-1">Call Us</h3>
                                        <p className="text-muted-foreground">+1 (555) 000-0000</p>
                                        <p className="text-muted-foreground">Mon-Fri from 9am to 6pm</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold mb-1">Visit Us</h3>
                                        <p className="text-muted-foreground">Academic Block A, Floor 3</p>
                                        <p className="text-muted-foreground">University Campus, Tech City</p>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative elements */}
                            <div className="mt-16 p-8 rounded-2xl bg-muted/30 border">
                                <h3 className="font-bold mb-4">Quick Support</h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Check our documentation or FAQs for quick answers to common questions.
                                </p>
                                <Button variant="link" className="p-0 h-auto text-primary font-bold">
                                    View Documentation
                                </Button>
                            </div>
                        </motion.div>

                        {/* Contact Form */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="p-8 rounded-3xl border bg-card shadow-xl"
                        >
                            <form className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="first-name">First Name</Label>
                                        <Input id="first-name" placeholder="John" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="last-name">Last Name</Label>
                                        <Input id="last-name" placeholder="Doe" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email" type="email" placeholder="john@example.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input id="subject" placeholder="How can we help?" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea id="message" placeholder="Type your message here..." className="min-h-[150px]" />
                                </div>
                                <Button className="w-full h-12 text-base font-bold group">
                                    Send Message
                                    <Send className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
