"use client"

import Link from "next/link"
import { ShieldAlert, ArrowLeft, Home } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top_left,rgba(56,189,248,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.08),transparent_50%)] p-4 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative max-w-md w-full"
      >
        {/* Decorative background elements */}
        <div className="absolute -inset-4 bg-gradient-to-tr from-sky-500/10 via-violet-500/5 to-transparent blur-3xl -z-10 opacity-50" />
        
        <div className="rounded-[32px] border border-border/50 bg-background/60 p-8 shadow-[0_24px_50px_rgba(0,0,0,0.04)] backdrop-blur-2xl">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute -inset-2 rounded-full bg-red-500/10 blur-md animate-pulse" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 text-red-500 shadow-sm border border-red-200/50 dark:border-red-800/30">
                <ShieldAlert className="h-10 w-10" />
              </div>
            </div>
          </div>

          <h1 className="mb-3 text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Access Denied
          </h1>
          
          <p className="mb-8 text-muted-foreground leading-relaxed">
            You don&apos;t have the necessary permissions to access this page. If you believe this is an error, please contact your system administrator.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild variant="default" className="rounded-2xl px-6 h-12 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Link href="/dashboard" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Return to Dashboard
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="rounded-2xl px-6 h-12 border-border/60 hover:bg-muted/50 transition-all">
              <Link href="/login" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </Button>
          </div>
        </div>

        <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-8 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground/50"
        >
          SyncFlow Security Protocol
        </motion.p>
      </motion.div>
    </div>
  )
}
