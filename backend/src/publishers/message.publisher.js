
// backend/src/publishers/message.publisher.js
 import eventBus from "../lib/eventBus.js";
 import { io } from "../lib/socket.js";

// 신규 메시지 전송 (데이터 포함)
eventBus.on("message:sent", ({ roomId, newMessage }) => {
     // 해당 방 전체에 메시지 본체 전송
     io.to(roomId).emit("NEW_MESSAGE", newMessage);
});
   
// 입력 중 상태 전송 (Typing Indicator)
eventBus.on("message:typing", ({ roomId, userId, isTyping }) => {
    // 나를 제외한 방 멤버들에게만 전송
    io.to(roomId).except(`user:${userId}`).emit("USER_TYPING", { userId, isTyping });
});
   
// 읽음 확인 신호 전송
eventBus.on("message:read", ({ roomId, messageId, userId }) => {
    io.to(roomId).emit("MESSAGE_READ", { messageId, userId });