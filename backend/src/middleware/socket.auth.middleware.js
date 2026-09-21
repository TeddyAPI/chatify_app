import jwt from "jsonwebtoken"
import User from "../models/User.js"
import { ENV } from "../lib/env.js"

export const socketAuthMiddleware = async (socket, next) => {
    try {
        console.log("start a socket middleware")
        //frontend에서 socket.io를 호출해 통신에 참여하면 브라우저에서 로그인시 생성된 token을 socket.handshake.headers.cookies에 담아 전달한다.
        //socket 통신에 참여전 token을 검증한다.
        const token = socket.handshake.headers.cookie
            ?.split("; ")
            .find((row) => row.startsWith("jwt="))
            ?.split("=")[1];

        if (!token) {
            console.log("Socket connection rejected: No token provided");
            return next(new Error("Unauthorized - No Token Provided"));
        }

        //jwt 검증 후 payload 부분만 반환받아 decoded 생성
        const decoded = jwt.verify(token, ENV.JWT_SECRET);
        if (!decoded) {
            console.log("Socket connection rejected: Invalid token");
            return next(new Error("Unauthorized - Invalid Token"));
        }

        //decoded에 담겨있는 userId를 사용해 db에서 해당 유저 정보를 받아온다.(password 제외)
        const user = await User.findById(decoded.userId).select("-password");
        if(!user) {
            console.log("Socket connection rejected: User not found");
            return next(new Error("User not found"));
        }

        //db에서 얻은 풀 user 정보를 socket.user에 업데이트한다.
        socket.user = user;

        //user._id는 objectId 타입이라 string으로 변환 후 대입
        socket.userId = user._id.toString()

        console.log(`Socket authenticated for user: ${user.fullName} (${user._id})`);

        next()

    } catch (error) {
        console.log("Error in socket authentication:", error.message);
        next(new Error("Unauthorized - Authentication failed"));
    }
};