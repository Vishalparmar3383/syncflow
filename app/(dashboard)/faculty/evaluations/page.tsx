"use client"

import * as React from "react"
import { z } from "zod"
import { GraduationCap, Loader2 } from "lucide-react"

import { FacultyPageShell } from "@/components/faculty/faculty-page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { calculateRubricAverage, EVALUATION_RUBRIC } from "@/lib/evaluation-rubric"
import { getApiUrl } from "@/lib/api"

type Evaluation = {
  evaluation_id: number
  total_marks?: string | number | null
  awarded_progress?: string | number | null
  remarks?: string | null
  evaluation_status?: string | null
  acd_project_group?: {
    project_group_id: number
    project_group_name?: string | null
    project_title?: string | null
    progress_percentage?: string | number | null
  } | null
}

const remarksSchema = z.object({
  remarks: z.string().trim().max(1000).optional(),
})

export default function FacultyEvaluationsPage() {
  const [evaluations, setEvaluations] = React.useState<Evaluation[]>([])
  const [loading, setLoading] = React.useState(true)
  const [openEvaluationId, setOpenEvaluationId] = React.useState<number | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [apiError, setApiError] = React.useState<string | null>(null)
  const [remarks, setRemarks] = React.useState("")
  const [incrementalProgress, setIncrementalProgress] = React.useState("0")
  const [scores, setScores] = React.useState<Record<string, string>>(
    Object.fromEntries(EVALUATION_RUBRIC.map((criterion) => [criterion.key, "0"]))
  )

  const loadData = React.useCallback(async () => {
    try {
      const response = await fetch(getApiUrl("/api/faculty/evaluations"))
      const result = await response.json()
      setEvaluations(Array.isArray(result) ? result : [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const pendingEvaluations = evaluations.filter((evaluation) => evaluation.evaluation_status === "Pending")
  const completedEvaluations = evaluations.filter((evaluation) => evaluation.evaluation_status === "Completed")
  const activeEvaluation =
    pendingEvaluations.find((evaluation) => evaluation.evaluation_id === openEvaluationId) || null

  const parsedScores = EVALUATION_RUBRIC.map((criterion) => ({
    criteria_name: criterion.title,
    score: Number(scores[criterion.key] || 0),
  }))
  const rubricPreview = calculateRubricAverage(parsedScores)

  const openEvaluation = (evaluation: Evaluation) => {
    setOpenEvaluationId(evaluation.evaluation_id)
    setRemarks("")
    setIncrementalProgress("0")
    setScores(Object.fromEntries(EVALUATION_RUBRIC.map((criterion) => [criterion.key, "0"])))
    setApiError(null)
  }

  const closeDialog = () => {
    setOpenEvaluationId(null)
    setRemarks("")
    setIncrementalProgress("0")
    setScores(Object.fromEntries(EVALUATION_RUBRIC.map((criterion) => [criterion.key, "0"])))
    setApiError(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setApiError(null)

    if (!openEvaluationId) {
      setApiError("Evaluation request not found.")
      return
    }

    const parsedRemarks = remarksSchema.safeParse({ remarks })
    if (!parsedRemarks.success) {
      setApiError(parsedRemarks.error.issues[0]?.message || "Invalid remarks.")
      return
    }

    const hasInvalidScore = EVALUATION_RUBRIC.some((criterion) => {
      const value = Number(scores[criterion.key])
      return Number.isNaN(value) || value < 0 || value > 100
    })

    if (hasInvalidScore) {
      setApiError("Each rubric score must be between 0 and 100.")
      return
    }

    const increment = Number(incrementalProgress)
    const currentProgress = Number(activeEvaluation?.acd_project_group?.progress_percentage || 0)
    const finalProgress = currentProgress + increment

    if (Number.isNaN(increment) || increment < 0) {
      setApiError("Progress increment must be a positive number.")
      return
    }
    
    if (finalProgress > 100) {
      setApiError(`Total progress cannot exceed 100% (Current: ${currentProgress}%, New total: ${finalProgress}%).`)
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(getApiUrl("/api/faculty/evaluations"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluation_id: openEvaluationId,
          remarks: parsedRemarks.data.remarks,
          progress_percentage: finalProgress,
          scores: Object.fromEntries(
            EVALUATION_RUBRIC.map((criterion) => [criterion.key, Number(scores[criterion.key] || 0)])
          ),
        }),
      })

      const result = await response.json()
      if (response.ok) {
        closeDialog()
        await loadData()
      } else {
        setApiError(result.error || "Failed to evaluate project.")
      }
    } catch (error) {
      console.error(error)
      setApiError("Failed to evaluate project.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FacultyPageShell
      title="Evaluations"
      description="Use the fixed criteria to evaluate each request. The overall average updates project progress."
      metrics={[
        {
          label: "Pending requests",
          value: pendingEvaluations.length,
          hint: "Student leader requests waiting for your review.",
          tone: "amber",
        },
        {
          label: "Completed",
          value: completedEvaluations.length,
          hint: "Evaluations already finalized by you.",
          tone: "violet",
        },
      ]}
    >
      <Dialog open={Boolean(openEvaluationId)} onOpenChange={(open) => (!open ? closeDialog() : null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-[28px]">
          <DialogHeader>
            <DialogTitle>Evaluate project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <p className="font-semibold">
                {activeEvaluation?.acd_project_group?.project_group_name || "Project group"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeEvaluation?.acd_project_group?.project_title || "Project title not available"}
              </p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Current stored progress</span>
                    <span className="text-lg font-bold">
                      {Number(activeEvaluation?.acd_project_group?.progress_percentage || 0)}%
                    </span>
                  </div>
                  <Progress
                    value={Number(activeEvaluation?.acd_project_group?.progress_percentage || 0)}
                    className="h-4 bg-amber-500/15 [&>div]:bg-amber-500"
                  />
                </div>
            </div>

            <div className="space-y-3">
              <Label>Evaluation criteria (each out of 100)</Label>
              {EVALUATION_RUBRIC.map((criterion) => (
                <div
                  key={criterion.key}
                  className="rounded-2xl border border-border/60 bg-background/70 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{criterion.title}</p>
                      <p className="text-sm text-muted-foreground">Score range: 0 to 100</p>
                    </div>
                    <div className="flex w-full flex-col gap-4 md:w-80">
                      <div className="flex items-center gap-4">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          className="w-24 text-center font-semibold"
                          value={scores[criterion.key]}
                          onChange={(event) => {
                            const val = event.target.value;
                            if (Number(val) <= 100) {
                              setScores((current) => ({
                                ...current,
                                [criterion.key]: val,
                              }))
                            }
                          }}
                        />
                        <Slider
                          value={[Number(scores[criterion.key] || 0)]}
                          max={100}
                          step={1}
                          className="flex-1"
                          onValueChange={([value]) => 
                            setScores((current) => ({
                              ...current,
                              [criterion.key]: String(value),
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-5 shadow-sm shadow-violet-500/5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-violet-700">Computed request average</span>
                <span className="text-2xl font-bold text-violet-700">{rubricPreview.average}%</span>
              </div>
              <Progress value={rubricPreview.average} className="mt-4 h-4 bg-violet-500/15 [&>div]:bg-violet-600" />
            </div>

            <div className="space-y-2">
              <Label>Feedback</Label>
              <Textarea
                className="min-h-28 resize-none"
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
              />
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 shadow-sm shadow-emerald-500/5">
              <div className="space-y-5">
                <div className="flex flex-col gap-3">
                  <Label className="text-emerald-900">Increase project progress (%)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min="0"
                      max={100 - Number(activeEvaluation?.acd_project_group?.progress_percentage || 0)}
                      step="1"
                      className="w-24 text-center font-semibold border-emerald-500/30 focus-visible:ring-emerald-500"
                      value={incrementalProgress}
                      onChange={(event) => {
                        const val = event.target.value;
                        const maxInc = 100 - Number(activeEvaluation?.acd_project_group?.progress_percentage || 0);
                        if (Number(val) <= maxInc) {
                          setIncrementalProgress(val);
                        }
                      }}
                    />
                    <Slider
                      value={[Number(incrementalProgress || 0)]}
                      max={Math.max(0, 100 - Number(activeEvaluation?.acd_project_group?.progress_percentage || 0))}
                      step={1}
                      className="flex-1"
                      onValueChange={([value]) => setIncrementalProgress(String(value))}
                    />
                  </div>
                  <p className="text-xs text-emerald-700/70">
                    Current base progress: {Number(activeEvaluation?.acd_project_group?.progress_percentage || 0)}%
                  </p>
                </div>
                
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-800">Projected new total</span>
                    <span className="text-xl font-bold text-emerald-800">
                      {Math.min(100, Number(activeEvaluation?.acd_project_group?.progress_percentage || 0) + Number(incrementalProgress || 0)).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={Number(activeEvaluation?.acd_project_group?.progress_percentage || 0) + Number(incrementalProgress || 0)} 
                    className="h-5 bg-emerald-500/20 [&>div]:bg-emerald-600 border border-emerald-500/10" 
                  />
                </div>
              </div>
            </div>

            {apiError ? <p className="text-sm text-destructive">{apiError}</p> : null}

            <DialogFooter>
              <Button variant="outline" type="button" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Evaluate"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="pending" className="grid gap-6">
        <TabsList className="bg-background/80 border border-border/60 justify-start h-auto w-full flex-wrap p-1">
          <TabsTrigger value="pending" className="flex-1 min-w-[120px]">
            Pending
            {pendingEvaluations.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-700">
                {pendingEvaluations.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 min-w-[120px]">
            Completed
            {completedEvaluations.length > 0 && (
              <span className="ml-2 rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-700">
                {completedEvaluations.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid gap-5">
            {loading ? (
              <div className="flex h-40 items-center justify-center rounded-2xl border border-border/60 bg-background/70">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : pendingEvaluations.length ? (
              pendingEvaluations.map((evaluation) => (
                <div
                  key={evaluation.evaluation_id}
                  className="rounded-2xl border border-amber-500/20 bg-background/70 p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-lg">
                        {evaluation.acd_project_group?.project_group_name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {evaluation.acd_project_group?.project_title}
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                        Current progress
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <Progress
                          value={Number(evaluation.acd_project_group?.progress_percentage || 0)}
                          className="h-3 w-48 bg-amber-500/12 [&>div]:bg-amber-500"
                        />
                        <span className="text-sm font-medium">
                          {Number(evaluation.acd_project_group?.progress_percentage || 0)}%
                        </span>
                      </div>
                    </div>
                    <Button className="rounded-xl shadow-md" onClick={() => openEvaluation(evaluation)}>
                      Evaluate project
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-border/60 bg-background/70 p-8 text-center text-sm text-muted-foreground">
                <GraduationCap className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
                No pending evaluation requests
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid gap-5">
            {!loading && completedEvaluations.length ? (
              completedEvaluations.map((evaluation) => (
                <Card
                  key={evaluation.evaluation_id}
                  className="rounded-[28px] border-violet-500/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.08),rgba(255,255,255,0)),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] shadow-none"
                >
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <GraduationCap className="h-5 w-5 text-violet-600" />
                        {evaluation.acd_project_group?.project_group_name || "Project group"}
                      </CardTitle>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {evaluation.acd_project_group?.project_title || "Project title not available"}
                      </p>
                    </div>
                    <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-sm">
                      {evaluation.evaluation_status || "Completed"}
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>Request average: {evaluation.total_marks || "0.00"}%</p>
                    <p>{evaluation.remarks || "No remarks recorded."}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Faculty-awarded progress</span>
                        <span className="font-medium">
                          {Number(evaluation.awarded_progress || evaluation.acd_project_group?.progress_percentage || 0)}%
                        </span>
                      </div>
                      <Progress
                        value={Number(evaluation.awarded_progress || evaluation.acd_project_group?.progress_percentage || 0)}
                        className="h-3 bg-violet-500/12 [&>div]:bg-violet-600"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : !loading && completedEvaluations.length === 0 ? (
              <div className="rounded-2xl border border-border/60 bg-background/70 p-8 text-center text-sm text-muted-foreground">
                <GraduationCap className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
                No completed evaluations yet
              </div>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </FacultyPageShell>
  )
}
