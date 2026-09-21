import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";
import Room from "../models/Room.js";
import { createRoomController } from "./controllers/room.controller.js";
//======================== http 서버생성 ========================
const app = express();

const server = http.createServer(app);

//======================== 소켓 통신 기본 준비========================
const io = new Server(server, {
    cors: {
        origin: [ENV.CLIENT_URL],
        credentials: true,
    },
});

io.use(socketAuthMiddleware);

// 온라인 유저 관리를 위한 Map+Set 형태(중복 데이터 방지)의 data, userId: [socektId1, socektId2 ...]
const userSocketMap = new Map();

// 특정 유저가 온라인인지 확인하는 함수 
export const isUserOnline = (userId) => {
    return userSocketMap.has(userId.toString());
};

// userSocketMap에서 key 값만 배열로 반환
const getOnlineUserIds = () => {
    return Array.from(userSocketMap.keys());
}

//======================== 소켓 통신 연결========================
io.on("connection", async (socket) => {

    // *** socket 통신 참여시 userSocketMap 객체에 해당 접보 업데이트 및 자신의 room 생성***
    //userId를 socket에서 얻고 없으면 실행 중지
    const userId = socket.userId?.toString();
    if(!userId) return socket.disconnect()

    //userSocketMap에 해당 id의 data가 없으면 id를 키값으로 하고 value는 set 형태인 데이터 생성하고
    //있으면 해당 ID에 socket id를 추가한다.
    //set의 사용 이유는 중복 data 방지
    //여러 디바이스로 접속시 해당 유저id에 중복이 방직된 [] 형태로 여러개의 socketId가 저장됨
    if (!userSocketMap.has(userId)) {
        userSocketMap.set(userId, new Set())
    }
    userSocketMap.get(userId).add(socket.id)

    //userId 사용해 자신의 방을 생성, 여러 디바스이스를 통해 접속해도 같은 방에 접속 
    //개인 알림 전송 또는 다른 기기와의 동기화를 위해 사용
    //disconnect() 호출시 자동으로 해당 socket.id로 접속한 room에서 해당 정보가 빠짐
    socket.join(`user:${userId}`);

    // 접속 시 온라인 유저 목록 브로드캐스트
    io.emit("getOnlineUsers", getOnlineUserIds());

    // *** DB 기반 기존 참여 방 자동 조인 ***
    try {
        //로그인 유저의 ID로 기존에 참여한 room을 DB에서 검색
        const rooms = await Room.find({ 
            participants: userId,
            isActive: true 
        });

        //rooms에서 각 room의 _id를 꺼내 각 room에 조인한다.
        rooms.forEach(room =>{
            const roomId = room._id.toString();
            socket.join(roomId);
            console.log(`User ${userId} joined room: ${roomId}`)
        });

    } catch (error) {
        console.error("Error joining persistent rooms:", error);
    }

   
    //나 자신에게만 전송, disconnect 이벤트를 발생시켜 소켓 통신에서 제외된다. 
    socket.on("disconnect", () => {
        //userId에 해당하는 socket.id를 가진 set
        const userSockets = userSocketMap.get(userId)
        if (userSockets) {
            //해당 소켓 통의 id를 set에서 삭제
            userSockets.delete(socket.id);

            //연결된 socket.id가 없을때는 해당 user의 id 를 삭제
            if (userSockets.size === 0 ) {
                if (userSocketMap.delete(userId))
            }
        }
        io.emit("getOnlineUsers", getOnlineUserIds());
        console.log(`User ${userId} disconnected`);
    });
})

export { io, app, server };