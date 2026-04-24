// Simple in-memory store — resets when server restarts
const sessions = new Map();

export const sessionStore = {
  create: (data) => {
    const id = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const session = {
      _id:         id,
      id:          id,
      ...data,
      status:      "active",
      participant: null,
      createdAt:   new Date(),
    };
    sessions.set(id, session);
    return session;
  },

  findById: (id) => sessions.get(id) || null,

  findAll: () => Array.from(sessions.values()),

  findActive: () =>
    Array.from(sessions.values()).filter((s) => s.status === "active"),

  findByUser: (userId) =>
    Array.from(sessions.values()).filter(
      (s) => s.host?._id === userId || s.participant?._id === userId
    ),

  update: (id, data) => {
    const session = sessions.get(id);
    if (!session) return null;
    const updated = { ...session, ...data };
    sessions.set(id, updated);
    return updated;
  },

  delete: (id) => sessions.delete(id),
};