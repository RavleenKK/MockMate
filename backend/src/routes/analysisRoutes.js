import express from "express"
import multer from "multer"
import { protectRoute } from "../middleware/protectRoute.js"
import { submitAnalysis, getAnalysis, getMyAnalyses } from "../controllers/analysisController.js"

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post("/:sessionId", protectRoute, upload.fields([
  { name: "audio", maxCount: 1 },
  { name: "video", maxCount: 1 },
]), submitAnalysis)

router.get("/my", protectRoute, getMyAnalyses)
router.get("/:sessionId", protectRoute, getAnalysis)

export default router