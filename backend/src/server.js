// const express = require('express')
import express from "express";
import { ENV } from "./lib/env.js";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";

import { connectDB } from "./lib/db.js";
import userRoutes from "./routes/user.route.js"
import messageRoutes from "./routes/message.route.js"
import roomRoutes from "./routes/room.route.js"

import { app, server } from "./lib/old.socket.js";

//현재 작업 디렉터리(CWD)를 절대 경로로 반환
const __dirname = path.resolve();
console.log("__dirname",__dirname)

const PORT = ENV.PORT || 3000;

// app.get("/", (req,res) => {
//     res.send("Hello World!");
// })

//JSON 형식의 요청(body)을 자동으로 파싱해서 req.body로 만들어주는 미들웨어
//POST 요청할 때 { name: "Tom" } 같은 body를 서버가 바로 읽을 수 있게 해줌
app.use(express.json({ limit: "5mb" })); 

//프론트엔드(React)와 백엔드(Express)가 서로 다른 도메인/포트일 때 발생하는 보안 차단을 해제
//origin: ENV.CLIENT_URL 이 URL에서 오는 요청만 허용.
//credentials: true 쿠키, 인증 토큰 등을 포함한 요청을 허용, 로그인/세션 기반 인증을 쓰려면 반드시 필요
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true}))

//요청에 포함된 쿠키를 읽어서 req.cookies에 파싱해주는 미들웨어
//인증 시스템(JWT, 로그인, 로그아웃, 사용자인증 상태)을 사용할 거면 거의 필수
app.use(cookieParser())

app.use("/api/auth", userRoutes)
app.use("/api/messages", messageRoutes)
app.use("/api/rooms", roomRoutes)

//백엔드 한군데에서 프론트와 API 모두 서빙하는 구조에서 SPA의 내부 라우터 경로를 모르기 때문에 어떤 주소가 들어오든 index.html 반환
//React/Vite 빌드한 결과(dist 폴더)를 정적(static)파일로 제공 즉, /dist 안에 있는 js, css, 이미지들이 Express에서 서빙됨
//서버가 파일을 그대로 브라우저에 전달(client)
if (ENV.NODE_ENV === "production") {
    //설정된 주소로 바로 접금가능하게 한다.
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    //res에 index.html을 담아 반환
    app.get("*", (_, res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    });
}

server.listen(PORT, () => {
    console.log("Server running on port:" + PORT )
    connectDB();
    }
)


