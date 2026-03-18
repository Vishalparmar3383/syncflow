export const EVALUATION_RUBRIC = [
  {
    key: "team_work",
    title: "Team work",
  },
  {
    key: "presentation",
    title: "Presentation",
  },
  {
    key: "code_quality",
    title: "Code quality",
  },
  {
    key: "problem_solving",
    title: "Problem solving",
  },
  {
    key: "technical_implementation",
    title: "Technical implementation",
  },
] as const

export function calculateRubricAverage(
  scores: Array<{ criteria_name: string; score: number }>
) {
  const mapped = EVALUATION_RUBRIC.map((criterion) => {
    const score =
      scores.find((entry) => entry.criteria_name === criterion.title)?.score ?? 0

    return {
      ...criterion,
      score,
    }
  })

  const average =
    mapped.length === 0
      ? 0
      : mapped.reduce((sum, item) => sum + item.score, 0) / mapped.length

  return {
    average: Number(average.toFixed(2)),
    details: mapped,
  }
}
