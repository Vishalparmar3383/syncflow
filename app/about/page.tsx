"use client"

import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { motion } from "framer-motion"
import {
  GraduationCap,
  Users,
  UserCog,
  UserCheck,
  Shield,
  Target,
  Lightbulb,
  Building2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const values = [
  {
    title: "Our Mission",
    description: "To digitize and simplify academic project management, fostering innovation and transparency in education.",
    icon: Target,
  },
  {
    title: "Innovation",
    description: "Leveraging modern technology to solve age-old administrative challenges in academic institutions.",
    icon: Lightbulb,
  },
  {
    title: "Integrity",
    description: "Ensuring academic honesty and accountability throughout the project lifecycle.",
    icon: Shield,
  },
]

const roles = [
  {
    name: "Administrators",
    description: "Full control over institutional structure, departments, and project governance.",
    icon: UserCog,
  },
  {
    name: "Faculty",
    description: "Mentoring, tracking progress, and providing expert evaluation for student groups.",
    icon: UserCheck,
  },
  {
    name: "Students",
    description: "Collaborating in groups, submitting work, and receiving structured feedback.",
    icon: Users,
  },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,var(--primary-muted)_0%,transparent_100%)] opacity-20" />
        <div className="container px-4 mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <Building2 className="w-8 h-8 text-primary" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            About <span className="text-primary">SyncFlow</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed"
          >
            SyncFlow is a state-of-the-art Student Project Management System designed to bridge the gap between students, faculty, and administration.
          </motion.p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold mb-6">Empowering Academic Excellence</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed text-lg">
                Traditional project management in academic institutions often suffers from fragmented communication, manual tracking, and delayed feedback. SyncFlow was born out of the need for a unified, transparent, and efficient digital ecosystem.
              </p>
              <p className="text-muted-foreground leading-relaxed text-lg">
                We believe that by providing the right tools, we can let students focus on what matters most: innovation and learning, while faculty and admins can manage with clarity and precision.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-blue-500/40 mix-blend-multiply" />
              <div className="absolute inset-0 flex items-center justify-center">
                <GraduationCap className="w-24 h-24 text-white opacity-50" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Our Core Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The principles that drive every feature we build in SyncFlow.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-8 rounded-2xl border bg-card hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-24 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Who is it for?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              SyncFlow provides a specialized experience for every role in the academic hierarchy.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {roles.map((role, index) => (
              <motion.div
                key={role.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group p-8 rounded-2xl bg-background border hover:border-primary/50 transition-all text-center"
              >
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <role.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">{role.name}</h3>
                <p className="text-muted-foreground">{role.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container px-4 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto p-12 rounded-3xl bg-primary text-primary-foreground text-center relative overflow-hidden"
          >
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to get started?</h2>
              <p className="text-lg opacity-90 mb-10 max-w-2xl mx-auto">
                Join institutional project groups and experience the future of academic management today.
              </p>
              <Button asChild size="lg" variant="secondary" className="font-bold">
                <Link href="/login">Explore Deployment</Link>
              </Button>
            </div>
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl" />
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

