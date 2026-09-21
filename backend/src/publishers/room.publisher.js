import eventBus from "../lib/eventBus.js";
import { io } from "../lib/socket.js";

eventBus.on("room:created:direct", ({ roomId, participants
}) => {
    participants.forEach(userId => {
        io.in(`user:${userId}`).socketsJoin(roomId);
    });

});



// 초대 수락/참여 시 모든 기기를 해당 방에 조인시키고 알림 전송
eventBus.on("room:joined", ({ userId, roomId, creatorInfo, roomType }) => {
    console.log(`[RoomPublisher] Joining user:${userId} to room:${roomId}`);
    //`user:${createdBy}`은 로그인 유저의 개인 룸으로 안에 있는 모든 소켓id를 newRoom._id.toString()에 해당하는 룸에 조인
    io.in(`user:${userId}`).socketsJoin(roomId);

    if (roomType !== 'direct') {
         // 생성자 본인 제외하고 room에 알림 전송
        io.to(roomId)
        .except(`user:${userId}`)
        .emit("user_joined", {
            userId,
            creatorInfo
        });
    }
});

// 방 퇴장 알림 및 소켓 채널 이탈
eventBus.on("room:left", ({ userId, roomId, leftMessage }) => {
    console.log(`[RoomPublisher] Leaving user:${userId} from room:${roomId}`);
    io.in(`user:${userId}`).socketsLeave(roomId);
    io.to(roomId).emit("user_left", { userId, message: leftMessage });
});

// 방 삭제/비활성화 알림
eventBus.on("room:deleted", ({ roomId, message }) => {
    console.log(`[RoomPublisher] Room deleted: ${roomId}`);
    io.to(roomId).emit("room_deleted", { roomId, message });
    io.socketsLeave(roomId);
});

// 방 초대 알림
eventBus.on("room:invited", ({ targetUserIds, roomData }) => {
    console.log(`[RoomPublisher] Publishing room_invitation to ${targetUserIds.length} users`);
    targetUserIds.forEach(userId => {
        io.to(`user:${userId}`).emit("room_invitation", roomData);
    });
});