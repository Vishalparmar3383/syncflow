"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Bell, CheckCircle2, LayoutTemplate, Loader2, MoonStar, Save, ShieldCheck, Smartphone, SunMedium } from "lucide-react"
import { useTheme } from "next-themes"

import { ProfilePageShell } from "@/components/profile/profile-page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useUser } from "@/hooks/use-user"

interface SettingsState {
  theme: "Light" | "Dark"
  desktopNotifications: boolean
  meetingReminders: boolean
  compactSidebar: boolean
}

const defaultSettings: SettingsState = {
  theme: "Dark",
  desktopNotifications: true,
  meetingReminders: true,
  compactSidebar: false,
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { userRole } = useUser()
  const [settings, setSettings] = useState<SettingsState>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/account/settings")
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || "Unable to load settings")
          return
        }

        setSettings(data)
        
        // Only set theme if it's explicitly different to avoid unnecessary cycles
        const newTheme = data.theme === "Light" ? "light" : "dark"
        if (theme !== newTheme) {
          setTheme(newTheme)
        }
      } catch {
        setError("Unable to load settings")
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Initial load only

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((current) => ({ ...current, [key]: value }))
    setMessage(null)
    setError(null)

    if (key === "theme") {
      setTheme(value === "Light" ? "light" : "dark")
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch("/api/account/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Unable to save settings")
        return
      }

      setMessage(data.message || "Settings saved successfully")
      
      // Refresh local settings state without re-triggering theme logic unnecessarily
      try {
        const refreshResponse = await fetch("/api/account/settings")
        const refreshData = await refreshResponse.json()
        if (refreshResponse.ok) {
          setSettings(refreshData)
        }
      } catch (e) {
        console.error("Error refreshing settings after save:", e)
      }
    } catch {
      setError("Unable to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <ProfilePageShell title="Settings" description="Loading your saved workspace preferences." accent="amber">
        <div className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-border/60 bg-card/75">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </ProfilePageShell>
    )
  }

  return (
    <ProfilePageShell title="Settings" description="Control appearance, reminders, and security shortcuts from the database-backed settings profile." accent="amber">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[28px] border-border/60 bg-card/75">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Your settings now persist through the dedicated user settings table.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-[24px] border border-sky-500/20 bg-sky-500/5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">Theme mode</p>
                  <p className="mt-1 text-sm text-muted-foreground">This preference is stored in the new settings schema and applied on load.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={settings.theme === "Light" ? "default" : "outline"}
                    size="sm"
                    className="rounded-xl"
                    onClick={() => updateSetting("theme", "Light")}
                  >
                    <SunMedium className="mr-2 h-4 w-4" />
                    Light
                  </Button>
                  <Button
                    type="button"
                    variant={settings.theme === "Dark" ? "default" : "outline"}
                    size="sm"
                    className="rounded-xl"
                    onClick={() => updateSetting("theme", "Dark")}
                  >
                    <MoonStar className="mr-2 h-4 w-4" />
                    Dark
                  </Button>
                </div>
              </div>
            </div>

            {[
              {
                key: "desktopNotifications" as const,
                icon: Bell,
                title: "Desktop notifications",
                description: "Show reminder prompts for reviews, approvals, and schedule changes.",
                tint: "bg-emerald-500/5 border-emerald-500/20",
              },
              {
                key: "meetingReminders" as const,
                icon: Smartphone,
                title: "Meeting reminders",
                description: "Highlight upcoming guide meetings and evaluation checkpoints inside the workspace.",
                tint: "bg-amber-500/5 border-amber-500/20",
              },
              {
                key: "compactSidebar" as const,
                icon: LayoutTemplate,
                title: "Prefer compact sidebar",
                description: "Keep sidebar navigation visually lighter when you mostly navigate via icons.",
                tint: "bg-rose-500/5 border-rose-500/20",
              },
            ].map((item) => (
              <div key={item.key} className={`rounded-[24px] border p-5 ${item.tint}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background/70">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <Switch checked={settings[item.key]} onCheckedChange={(checked) => updateSetting(item.key, checked)} />
                </div>
              </div>
            ))}

            {message ? (
              <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" />
                <p>{message}</p>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <Button onClick={saveSettings} disabled={isSaving} className="rounded-2xl bg-primary text-primary-foreground">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save settings
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-border/60 bg-card/75">
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Quick actions for password rotation and access recovery.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[24px] border border-border/60 bg-muted/35 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Password and recovery</p>
                    <p className="text-sm text-muted-foreground">Use strong passwords and validate OTPs before resetting access.</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  <Button asChild className="rounded-2xl bg-primary text-primary-foreground">
                    <Link href="/change-password">Change password</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-2xl">
                    <Link href="/forgot-password">Forgot password flow</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-border/60 bg-card/75">
            <CardHeader>
              <CardTitle>Workspace status</CardTitle>
              <CardDescription>Current access context and persistence layer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge className="bg-amber-500/15 text-amber-700 shadow-none dark:text-amber-300">{userRole ?? "Unknown role"}</Badge>
              <div className="grid gap-3">
                <div className="rounded-2xl border border-border/60 bg-muted/35 p-4 text-sm text-muted-foreground">
                  Settings are now persisted through `acd_user_settings` and loaded from the authenticated account settings API.
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/35 p-4 text-sm text-muted-foreground">
                  Profile updates continue to use the authenticated account profile API and role-specific tables.
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/35 p-4 text-sm text-muted-foreground">
                  Active theme in UI: <span className="font-medium text-foreground">{theme}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProfilePageShell>
  )
}
