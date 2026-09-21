//socket2는 server.js에 app 과 server가 존재 
//socket.js에는 socket 서버 객체 생성 및 io.on 상태로 시작하고 io를 리턴하는 함수 initSocket() 생성
//server.js에서 socket 서버를 작동시키는 함수인 initSocket(server)를 불러와 io에 할당 후 express에 주입
// 주입 후 controller에서 req.app.get("io") 형태로 사용

import { Server } from "socket.io";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

// ***server.js
import express from "express";
import http from "http";
import { initSocket } from "./old.socket.js";

const app = express();
const server = http.createServer(app);

// 1. Socket 초기화
const io = initSocket(server);

// 2. Express에 주입 
app.set("io", io);

// 3. 서버 시작
server.listen(PORT);


//***socket.js
export function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: [ENV.CLIENT_URL],
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    console.log("connected:", socket.user.fullName);

    socket.on("sendMessage", async (payload) => {
      // ❌ res 없음
      // ❌ controller 직접 호출 ❌
    });
  });

  return io;
}

//*** message.controller.js
export const sendMessage = async (req, res) => {
  const io = req.app.get("io"); // ⭐ 핵심

  // DB 저장
  const message = await Message.create({...});

  // 실시간 전파
  io.to(receiverSocketId).emit("newMessage", message);

  res.status(201).json(message);
};

