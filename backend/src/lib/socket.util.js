//해당  기능 notification.service 로 이전 완료 후 삭제 에정

import { io } from "./old.socket.js";


export const emitInvitation = (targetUserIds, { roomId, roomName, invitedBy }) => {
    
    targetUserIds.forEach(userId => {
        try {
             // io를 인자로 받을 필요 없이 여기서 바로 사용
            io.to(`user:${userId}`).emit("room_invitation", {
                roomId,
                roomName,
                invitedBy
            });
        } catch (error) {
            console.error(`Failed to send invitation to user ${userId}:`, error);
        }
       
    });
};