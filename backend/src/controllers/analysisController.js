import FormData from "form-data"
import fetch from "node-fetch"
import Analysis from "../models/Analysis.js"
import { ENV } from "../lib/env.js"

const ML_SERVICE_URL = ENV.ML_SERVICE_URL || "http://localhost:8000"

export async function submitAnalysis(req, res) {
  try {
    const { sessionId } = req.params
    const userId = req.user.clerkId

    const audioFile = req.files?.audio?.[0]
    const videoFile = req.files?.video?.[0]

    if (!audioFile && !videoFile) {
      return res.status(400).json({ message: "No files provided" })
    }

    // forward to Python ML service
    const form = new FormData()
    if (audioFile) form.append("audio", audioFile.buffer, { filename: "audio.wav", contentType: audioFile.mimetype })
    if (videoFile) form.append("video", videoFile.buffer, { filename: "video.webm", contentType: videoFile.mimetype })

    const mlResponse = await fetch(`${ML_SERVICE_URL}/analyze`, {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    })

    if (!mlResponse.ok) throw new Error("ML service failed")

    const mlResult = await mlResponse.json()

    // save to MongoDB
    const analysis = await Analysis.findOneAndUpdate(
      { sessionId },
      { sessionId, userId, ...mlResult },
      { upsert: true, new: true }
    )

    res.status(200).json({ analysis })
  } catch (err) {
    console.error("submitAnalysis error:", err.message)
    res.status(500).json({ message: "Analysis failed" })
  }
}

export async function getAnalysis(req, res) {
  try {
    const analysis = await Analysis.findOne({ sessionId: req.params.sessionId })
    if (!analysis) return res.status(404).json({ message: "No analysis found" })
    res.status(200).json({ analysis })
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch analysis" })
  }
}

export async function getMyAnalyses(req, res) {
  try {
    const analyses = await Analysis.find({ userId: req.user.clerkId })
      .sort({ createdAt: -1 })
      .limit(20)
    res.status(200).json({ analyses })
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch analyses" })
  }
}