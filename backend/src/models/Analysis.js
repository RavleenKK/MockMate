import mongoose from "mongoose"

const AnalysisSchema = new mongoose.Schema({
  sessionId:   { type: String, required: true, unique: true },
  userId:      { type: String, required: true },
  audio: {
    transcript:      String,
    wpm:             Number,
    energy_score:    Number,
    silence_ratio:   Number,
    pitch_variation: Number,
    word_count:      Number,
    duration_seconds:Number,
  },
  video: {
    dominant_emotion:  String,
    confidence_score:  Number,
    engagement_score:  Number,
    emotion_breakdown: mongoose.Schema.Types.Mixed,
  },
  insights: {
    overall_score:   Number,
    insights:        [String],
    recommendations: [String],
  },
}, { timestamps: true })

export default mongoose.model("Analysis", AnalysisSchema)