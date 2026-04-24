// in-memory store — persists during the session, resets on page refresh
const analyses = new Map()

export const analysisStore = {
  save: (sessionId, data) => {
    analyses.set(sessionId, data)
  },
  get: (sessionId) => {
    return analyses.get(sessionId) || null
  },
  getAll: () => {
    return Array.from(analyses.entries()).map(([sessionId, data]) => ({
      sessionId,
      ...data,
    }))
  },
}