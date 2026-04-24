// import { chatClient, streamClient } from "../lib/stream.js";
// import Session from "../models/Session.js";

// export async function createSession(req, res) {
//   try {
//     const { problem, difficulty } = req.body;
//     const userId = req.user._id;
//     const clerkId = req.user.clerkId;

//     if (!problem || !difficulty) {
//       return res.status(400).json({ message: "Problem and difficulty are required" });
//     }

//     // generate a unique call id for stream video
//     const callId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

//     // create session in db
//     const session = await Session.create({ problem, difficulty, host: userId, callId });

//     // create stream video call
//     await streamClient.video.call("default", callId).getOrCreate({
//       data: {
//         created_by_id: clerkId,
//         custom: { problem, difficulty, sessionId: session._id.toString() },
//       },
//     });

//     // chat messaging
//     const channel = chatClient.channel("messaging", callId, {
//       name: `${problem} Session`,
//       created_by_id: clerkId,
//       members: [clerkId],
//     });

//     await channel.create();

//     res.status(201).json({ session });
//   } catch (error) {
//     console.log("Error in createSession controller:", error.message);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// }

// export async function getActiveSessions(_, res) {
//   try {
//     const sessions = await Session.find({ status: "active" })
//       .populate("host", "name profileImage email clerkId")
//       .populate("participant", "name profileImage email clerkId")
//       .sort({ createdAt: -1 })
//       .limit(20);

//     res.status(200).json({ sessions });
//   } catch (error) {
//     console.log("Error in getActiveSessions controller:", error.message);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// }

// export async function getMyRecentSessions(req, res) {
//   try {
//     const userId = req.user._id;

//     // get sessions where user is either host or participant
//     const sessions = await Session.find({
//       status: "completed",
//       $or: [{ host: userId }, { participant: userId }],
//     })
//       .sort({ createdAt: -1 })
//       .limit(20);

//     res.status(200).json({ sessions });
//   } catch (error) {
//     console.log("Error in getMyRecentSessions controller:", error.message);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// }

// export async function getSessionById(req, res) {
//   try {
//     const { id } = req.params;

//     const session = await Session.findById(id)
//       .populate("host", "name email profileImage clerkId")
//       .populate("participant", "name email profileImage clerkId");

//     if (!session) return res.status(404).json({ message: "Session not found" });

//     res.status(200).json({ session });
//   } catch (error) {
//     console.log("Error in getSessionById controller:", error.message);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// }

// export async function joinSession(req, res) {
//   try {
//     const { id } = req.params;
//     const userId = req.user._id;
//     const clerkId = req.user.clerkId;

//     const session = await Session.findById(id);

//     if (!session) return res.status(404).json({ message: "Session not found" });

//     if (session.status !== "active") {
//       return res.status(400).json({ message: "Cannot join a completed session" });
//     }

//     if (session.host.toString() === userId.toString()) {
//       return res.status(400).json({ message: "Host cannot join their own session as participant" });
//     }

//     // check if session is already full - has a participant
//     if (session.participant) return res.status(409).json({ message: "Session is full" });

//     session.participant = userId;
//     await session.save();

//     const channel = chatClient.channel("messaging", session.callId);
//     await channel.addMembers([clerkId]);

//     res.status(200).json({ session });
//   } catch (error) {
//     console.log("Error in joinSession controller:", error.message);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// }

// export async function endSession(req, res) {
//   try {
//     const { id } = req.params;
//     const userId = req.user._id;

//     const session = await Session.findById(id);

//     if (!session) return res.status(404).json({ message: "Session not found" });

//     // check if user is the host
//     if (session.host.toString() !== userId.toString()) {
//       return res.status(403).json({ message: "Only the host can end the session" });
//     }

//     // check if session is already completed
//     if (session.status === "completed") {
//       return res.status(400).json({ message: "Session is already completed" });
//     }

//     // delete stream video call
//     const call = streamClient.video.call("default", session.callId);
//     await call.delete({ hard: true });

//     // delete stream chat channel
//     const channel = chatClient.channel("messaging", session.callId);
//     await channel.delete();

//     session.status = "completed";
//     await session.save();

//     res.status(200).json({ session, message: "Session ended successfully" });
//   } catch (error) {
//     console.log("Error in endSession controller:", error.message);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// }


import { chatClient, streamClient } from "../lib/stream.js";
import { sessionStore } from "../lib/sessionStore.js";

export async function createSession(req, res) {
  try {
    const { problem, difficulty } = req.body;

    if (!problem || !difficulty) {
      return res.status(400).json({ message: "Problem and difficulty are required" });
    }

    const callId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // use in-memory store instead of MongoDB
    const session = sessionStore.create({
      problem,
      difficulty,
      callId,
      host: {
        _id:          req.user._id || req.user.clerkId,
        clerkId:      req.user.clerkId,
        name:         req.user.name,
        profileImage: req.user.profileImage,
      },
    });

    // still create Stream video call
    try {
      await streamClient.video.call("default", callId).getOrCreate({
        data: {
          created_by_id: req.user.clerkId,
          custom: { problem, difficulty, sessionId: session._id },
        },
      });

      const channel = chatClient.channel("messaging", callId, {
        name: `${problem} Session`,
        created_by_id: req.user.clerkId,
        members: [req.user.clerkId],
      });
      await channel.create();
    } catch (streamErr) {
      console.error("Stream error (non-fatal):", streamErr.message);
    }

    res.status(201).json({ session });
  } catch (error) {
    console.error("createSession error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getActiveSessions(_, res) {
  try {
    const sessions = sessionStore.findActive();
    res.status(200).json({ sessions });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyRecentSessions(req, res) {
  try {
    const userId = req.user._id || req.user.clerkId;
    const sessions = sessionStore.findByUser(userId)
      .filter((s) => s.status === "completed")
      .slice(0, 20);
    res.status(200).json({ sessions });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getSessionById(req, res) {
  try {
    const session = sessionStore.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.status(200).json({ session });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function joinSession(req, res) {
  try {
    const session = sessionStore.findById(req.params.id);

    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.status !== "active") return res.status(400).json({ message: "Session is not active" });
    if (session.host._id === (req.user._id || req.user.clerkId)) {
      return res.status(400).json({ message: "Host cannot join own session" });
    }
    if (session.participant) return res.status(409).json({ message: "Session is full" });

    const updated = sessionStore.update(req.params.id, {
      participant: {
        _id:          req.user._id || req.user.clerkId,
        clerkId:      req.user.clerkId,
        name:         req.user.name,
        profileImage: req.user.profileImage,
      },
    });

    try {
      const channel = chatClient.channel("messaging", session.callId);
      await channel.addMembers([req.user.clerkId]);
    } catch (streamErr) {
      console.error("Stream error (non-fatal):", streamErr.message);
    }

    res.status(200).json({ session: updated });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function endSession(req, res) {
  try {
    const session = sessionStore.findById(req.params.id);

    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.host._id !== (req.user._id || req.user.clerkId)) {
      return res.status(403).json({ message: "Only host can end session" });
    }
    if (session.status === "completed") {
      return res.status(400).json({ message: "Session already completed" });
    }

    try {
      await streamClient.video.call("default", session.callId).delete({ hard: true });
      const channel = chatClient.channel("messaging", session.callId);
      await channel.delete();
    } catch (streamErr) {
      console.error("Stream error (non-fatal):", streamErr.message);
    }

    const updated = sessionStore.update(req.params.id, { status: "completed" });
    res.status(200).json({ session: updated, message: "Session ended successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}