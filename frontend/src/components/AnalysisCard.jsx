import { useState, useEffect } from "react"
import { analysisStore } from "../lib/analysisStore"

function ScoreRing({ score, label, color }) {
  const r = 28
  const c = 2 * Math.PI * r
  const filled = (score / 100) * c

  return (
    <div style={{ textAlign: "center" }}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle
          cx="36" cy="36" r={r}
          fill="none"
          stroke="var(--color-border-tertiary)"
          strokeWidth="6"
        />
        <circle
          cx="36" cy="36" r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={`${filled} ${c}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
        />
        <text
          x="36" y="40"
          textAnchor="middle"
          fontSize="14"
          fontWeight="500"
          fill="var(--color-text-primary)"
        >
          {score}
        </text>
      </svg>
      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
        {label}
      </div>
    </div>
  )
}

function AnalysisCard({ sessionId }) {
  const [data,      setData]      = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) return

    // poll local store until analysis appears (ML takes time)
    const interval = setInterval(() => {
      const result = analysisStore.get(sessionId)
      if (result) {
        setData(result)
        setIsLoading(false)
        clearInterval(interval)
      }
    }, 1000)

    // stop polling after 2 mins
    const timeout = setTimeout(() => {
      clearInterval(interval)
      setIsLoading(false)
    }, 120000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [sessionId])

  if (isLoading) return (
    <div className="card bg-base-100 shadow border border-base-300 p-6">
      <div className="flex items-center gap-3">
        <span className="loading loading-spinner loading-sm text-primary"></span>
        <p className="text-sm text-base-content/60">Analysing session...</p>
      </div>
    </div>
  )

  if (!data) return null

  return (
    <div className="card bg-base-100 shadow border border-base-300 p-6 space-y-6">

      <h2 className="text-xl font-bold">Session analysis</h2>

      {/* Score rings */}
      <div className="flex gap-6 justify-center flex-wrap">
        <ScoreRing score={data.insights?.overall_score  ?? 0} label="Overall"    color="#7F77DD" />
        <ScoreRing score={data.video?.confidence_score  ?? 0} label="Confidence" color="#1D9E75" />
        <ScoreRing score={data.video?.engagement_score  ?? 0} label="Engagement" color="#EF9F27" />
        <ScoreRing score={data.audio?.energy_score      ?? 0} label="Energy"     color="#D85A30" />
      </div>

      {/* Audio stats */}
      {data.audio && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Words/min",  value: data.audio.wpm },
            { label: "Word count", value: data.audio.word_count },
            { label: "Duration",   value: `${data.audio.duration_seconds}s` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-base-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-base-content/60 mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Emotion breakdown */}
      {data.video?.emotion_breakdown && (
        <div>
          <p className="text-sm font-medium mb-2">Emotion breakdown</p>
          <div className="space-y-2">
            {Object.entries(data.video.emotion_breakdown)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4)
              .map(([emotion, value]) => (
                <div key={emotion} className="flex items-center gap-2">
                  <span className="text-xs w-16 capitalize text-base-content/70">
                    {emotion}
                  </span>
                  <div className="flex-1 bg-base-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span className="text-xs w-8 text-right">
                    {Math.round(value)}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {data.insights?.insights?.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Insights</p>
          <ul className="space-y-1">
            {data.insights.insights.map((insight, i) => (
              <li key={i} className="text-sm text-base-content/80 flex gap-2">
                <span className="text-primary mt-0.5">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {data.insights?.recommendations?.length > 0 && (
        <div className="bg-base-200 rounded-xl p-4">
          <p className="text-sm font-medium mb-2">Recommendations</p>
          <ul className="space-y-1">
            {data.insights.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-base-content/70 flex gap-2">
                <span className="text-success mt-0.5">→</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Transcript */}
      {data.audio?.transcript && (
        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-base-content/70">
            View transcript
          </summary>
          <p className="mt-2 text-base-content/60 leading-relaxed">
            {data.audio.transcript}
          </p>
        </details>
      )}

    </div>
  )
}

export default AnalysisCard