import { Server } from "socket.io"
import http from "http"
import express from "express";
import { ENV } from "./env.js"
import { socketAuthMiddleware} from "../middleware/socket.auth.middleware.js"


//[1] server = createServer()     → 서버 객체 생성 (미실행)
// [2] io = new Server(server)     → socket 핸들러 등록
// [3] io.on("connection", ...)   → 연결 이벤트 준비
// [4] server.listen(PORT)        → 🚀 이 시점부터
//                                   - HTTP 요청 수신
//                                   - WebSocket 업그레이드 수신
//                                   - Socket.IO 정상 작동

//http 서버로만 사용할때는 express()의 객체인 app을 server.js에서 import하지만
//websocket을 사용하려면 http 서버 내부에서 socket 서버를 포함하는 형태로 작동해야 하기때문에 여기에 인스턴스를 생성한다.
const app = express();

//기존 server.js의 app.listen()은 내부에서 http 서버를 만들어버려서 외부에서 참조 할수 없기 때문에 socket.io가 붙을 수 없어 별도의 http 서버를 생성한다.
//http 서버 생성시 req, res를 처리하는 함수를 포함한 express() 객체인 app을 포함시킨다.
const server = http.createServer(app);

//io 서버는 http 요청으로 초기 연결(handshake)을 하고 이후 websocket으로 업그레이드 되기 때문에 http 서버를 포함한 
//io 서버를 생성한다.
const io = new Server(server, {
    cors: {
        origin: [ENV.CLIENT_URL],
        credentials: true,
    },
});

io.use(socketAuthMiddleware);

//userId에 해당하는 socketId를 반환, 메세지를 받는 사람의 socketId를 확인하여 메세지 보내는 용도
export function getReceiverSocketId(userId) {
    return userSocketMap[userId]
}

//userId1: "socketId1" 형태로 현재 온라인 유저와 연결된 socket.id를 저장한 객체
// 유저 ID를 키로 하고, 소켓 ID들을 담은 Set을 값으로 가짐
const userSocketMap = {};

// 로그인된 유저가 socket 통신에 참여, 이것은 socket은 "한 명의 유저"를 의미
io.on("connection", (socket) => {

    //socket객체에서 userId를 얻어와 socket.id와 함께 userId1: "socketId1" 형태로 userSocketMap 객체에 저장
    const userId = socket.userId;
    
    userSocketMap[userId] = socket.id;

    //연결된 모든 socket에게 브로드캐스트를 통해 socket 통신에 참여한 모든 유저의 userId를 알림
    io.emit("getOnlineUsers", Object.keys(userSocketMap))

    //나 자신에게만 전송, disconnect 이벤트를 발생시켜 소켓 통신에서 제외된다. 
    socket.on("disconnect", () => {
        
        //통신에서 제외된 userId를 userSocketMap 객체에서 제거
        delete userSocketMap[userId];
        
        //제거 후 변경된 userSocketMap 객체를 통신에 참여한 모든 유저에게 전송
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })
})

//io는 message.controller의 sendMessage() 호출시 io.to(userId).emit()을 사용해 메세지를 전송하기 위해 export
export { io, app, server }

