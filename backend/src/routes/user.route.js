import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { signup, login, logout, updateProfile } from "../controllers/user.controller.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router()

//보안을 위한 arcjet 미들웨어를 모든 요청에 적용한다.
router.use(arcjetProtection)

router.post("/signup", signup)

router.post("/login", login)

router.post("/logout", logout)

router.put("/update-profile", protectRoute, updateProfile)

router.get("/check", protectRoute, (req, res) => res.status(200).json(req.user))

export default router;          