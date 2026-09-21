import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if(!token) return res.status(401).json({ message: "Unauthorized - No token provided" });

        const decoded = jwt.verify(token, ENV.JWT_SECRET);
        if (!decoded) return res.status(401).json({ message: "Unauthorized - Invalid token" });

        const user = await User.findById(decoded.userId).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        //기존 req.user는 로그인 정보만 담고 있기 때문에 
        // DB에서 얻은 풀 유저 객체 정보를 req.user에 대입
        //추가된 req.user 는 몽고DB 객체 타입이라서 사용시 toString() 필요
        req.user = user

        next();

    } catch (error) {
        console.log("Error in protectRoute middleware:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

