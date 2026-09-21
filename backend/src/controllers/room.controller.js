// DirectRoom 생성 *
// GroupRoom 생성*
// Group 생성
// 초대 *
// 초대 수락 *
// 초대 거절 *
// 멤버 제거
// 방 나가기
// Admin 변경
// Owner 변경
// 방 이름 변경
// Room archive
// Room 목록 조회
// Unread 조회
// lastVisitedAt 업데이트



import * as roomService from "../services/room.service.js";
import { io } from "../lib/socket.js";
import * as notificationService from "../services/notification.service.js";


// -----------------------------------------------------------------------------
// Create Direct Room
// -----------------------------------------------------------------------------
export const createDirectRoom = async (req, res) => {
    try {
        //미들웨어에서 토큰확인 후 추가
        const userId = req.user._id.toString();

        //대화 상대 ID
        //{"participantId": "64def456"}로 전달
        const participantId = req.body.participantId.toString();

        //대화 상대가 DB에 있는지 확인
        const participant = await userRepository.findById(participantId);

        if (!participant) {
            throw new Error("User not found.");
        }

        //Direct Room을 생성을 위해 서비스 함수 호출
        const room = await roomService.createDirectRoom(userId, participantId);

        return res.status(201).json(room);

    } catch (error) {
        return res.status(500).json({
            message: error.message || "Failed to create direct room."
        });
    }
};


// -----------------------------------------------------------------------------
// Create Group Room
// -----------------------------------------------------------------------------
export const createGroupRoom = async (req, res) => {
    try {

        const { roomName } = req.body;

        const room = await roomService.createGroupRoom({
            roomName,
            createdBy: req.user._id.toString()
        });

        return res.status(201).json(room);

    } catch (error) {
        return res.status(500).json({
            message: error.message || "Failed to create group room."
        });
    }
};



// -----------------------------------------------------------------------------
// 초대장을 발송
// -----------------------------------------------------------------------------
export const inviteMember = async(req, res) => {
    try {
        
        const { roomId } = req.params; //params은 string을 반환 toString() 불필요

        //targetUserIds = ["64aaa111","64bbb222","64ccc333"] 형태 배열이라 toString() 불필요
        //toString()할 경우 "64aaa111,64bbb222,64ccc333" 로 하나의 문자열이 됨
        const { targetUserIds } = req.body;


        const inviterId = req.user._id.toString();

        // db에 새롭게 초대된 유저를 해당룸에 저장
        const result = await roomService.inviteMember(
            roomId,
            targetUserIds,
            inviterId
        )

        return res.status(200).json(result);

    } catch (error) {
        console.error("Error rejecting room invitation:", error);
        return res.status(500).json({ message: error.message || "Failed to reject invitation" });
    }
}


// *** invited된 유저가 join을 거부했을때*/
export const rejectRoomInvitation = async(req, res) => {
    try {
        
        const { roomId } = req.params;

        const userId = req.user._id;

        await roomService.rejectInvitation(roomId, userId);

        return res.status(200).json({ 
            message: "Invitation sent successfully", 
            invitedCount: newParticipants.length 
        });

    } catch (error) {
        console.error("Error inviting to room:", error);
        return res.status(500).json({ message: error.message 
            || "Invitation failed" });
    }
}


//*** 초대장을 수락하면 해당 유저의 상태를 DB에 업데이트 */
export const acceptInvitation = async (req, res) => {
    try {
        const { roomId } = req.params;

        const userId = req.user._id

        //DB 처리
        await roomService.acceptInvitation(roomId, userId)

        return res.status(200).json({ message: "Invitation accepted."})

    } catch (error) {
        console.error("Error accepting invitation:", error);
        return res.status(400).json({ message: error.message 
            || "Failed to accept invitation." });
    }
}


// *** 룸에 유저를 조인 시키는 함수로 초대장과 관계없이 바로 룸에 조인*/
export const joinRoom = async (req, res) => {
    try {
        const { roomId } = req.params;

        const userId = req.user._id;

        const room = await roomService.joinRoom(roomId, userId)

        return res.status(200).json(room);

    } catch (error) {
        console.error("Error in joinRoom controller:", error);

        // 서비스에서 던진 에러 메시지에 따라 분기 처리
        switch (error.message) {
            case "ROOM_NOT_FOUND":
                return res.status(404).json({ 
                    code: "ROOM_NOT_FOUND",
                    message: "The requested chat room could not be found."
                });

            case "ALREADY_JOINED":
                return res.status(409).json({ 
                    code: "ALREADY_JOINED",
                    message: "You are already a participant in this chat room."
                });

            default:
                // 예상치 못한 시스템 에러나 DB 에러 처리
                return res.status(400).json({ 
                    code: "BAD_REQUEST",
                    message: error.message || "Failed to join the chat room."
                });
        }
    }
};


export const leaveRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        
        const userId = req.user._id;

        await roomService.leaveRoom(roomId, userId);

        //해당 유저의 모든 기기를 해당 방(Room ID) 채널에서 퇴장시킴
        io.in(`user:${userId}`).socketsLeave(roomId);

        io.to(roomId).emit("user_left", {
            userId,
            message: "{ req.user.name || 'User'} has left the room. }"
        });

        return res.status(200).json({ message: "Left the room successfully."})

    } catch (error) {
        console.error("Error leaving room:", error)
        return res.status(400).json({ message: error.message 
            || "Failed to leave room"})
    }
}

export const deleteRoom = async(req, res) => {
    try {
        const { roomId } = req.params;

        const adminId = req.user._id;

        await roomService.deleteRoom(roomId, adminId);

        io.to(roomId).emit("room_deleted", {
            roomId,
            message: "This room has been deleted by the admin."
        });

        io.socketsLeave(roomId);

        return res.status(200).json({ message: "Room deleted successfully."})

    } catch (error) {
        console.error("Error deleting room:", error)
        return res.status(403).json({ message: error.message 
            || "Failed to delete room"})
    }
}

//status에 관계 없이 프런트로 전달하고 프런트에서 status에 따라 정렬
export const getUserRooms = async (req, res) => {
    try {
        const userId = req.user._id;
        console.log("userId in getUserRooms", userId)

        const rooms = await roomService.getUserRooms(userId);

        if ( !rooms || rooms.length === 0 ) {
            return res.status(200).json({
                message: "You have no active chats.",
                rooms: []
            })
        }

        return res.status(200).json(rooms);

    } catch (error) {
        console.error("Error fetching my rooms", error);
        return res.status(500).json({message: "Failed to fetch your rooms" })
    }
};

export const getDiscoverableRooms = async (req, res) => {
    try {
        const userId = req.user._id;

        const rooms = await roomService.getDiscoverableRooms(userId)

        return res.status(200).json(rooms)
    } catch (error) {
        console.error("Error fetching discoverable rooms:", error);
        return res.status(500).json({ message: "Failed to fetch discoverable rooms." });
    }
}


// // *** 생성할 room을 DB에 저장하고 룸에 참여할 유저에게 초대장 발송
// // To Do: 프런트 엔드에서 초대유저를 설정할때 방장 아이디는 나타나지 않게 필터링 해야함
// export const createRoom = async(req, res) => {
//     try {
        
//         const { roomName, participants, type } = req.body;

//         const createdBy = req.user._id

//         if (!roomName || !participants ) {
//             throw new Error("Room name and participants are required.")
//         }

//         const createdRoom = await roomService.createRoom({
//             roomName, 
//             participants,
//             type: type || 'group', // type이 'direct'이면 1:1 로직이 실행됨
//             createdBy,
//             creatorInfo: { fullName: req.user.fullName, profilePic: req.user.profilePic }
//         });

//         return res.status(201).json(createdRoom)

//     } catch (error) {
//         return res.status(500).json({ message: "Room creation failed."})
//     }
// }