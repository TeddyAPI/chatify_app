import { withTransaction } from ".../lib/transaction.js";
import * as roomRepository from "../repositories/room.repository.js";
import * as roomMembershipRepository from "../repositories/roomMembership.repository.js";
import * as roomMembershipHistoryRepository from "../repositories/roomMembershipHistory.repository.js";



// -----------------------------------------------------------------------------
// Create Direct Room
// -----------------------------------------------------------------------------
export const createDirectRoom = async (userId, participantId) => {

    // 자기 자신과의 DM 방 생성 방지
    // 확률은 낮지만  participantId에 currentUserId를 대입해 전달 되수 있고 악의적 공경도 가능
    if (userId.toString() === participantId.toString()) {
        throw new Error(
            "Direct room participants must be different users."
        );
    }

    //dmKey 생성, dmKey는 두 유저가 참여된 group room이 검색되는 것을 방지하기위해 sort()로 정렬된 문자열을 사용
    const dmKey = [userId.toString(), participantId.toString()]
        .sort()
        .join("_");

    // MongoDB Transaction   
    const result = await withTransaction(async (session) => {

        const room = await roomRepository.createDirectRoom({
            dmKey,
            userId,
            session
        });

        await roomMembershipRepository.createDirectRoomMemberships({
            roomId: room._id,
            userId,
            participantId,
            session
        });

        // callback → withTransaction
        return room;
    });

    // // Transaction 성공 후 Event 발생
    // eventBus.emit("room:created:direct", {
    //     roomId: room._id.toString(),
    //     participants: [
    //         userId.toString(),
    //         participantId.toString()
    //     ]
    // });

    return result;
};


// -----------------------------------------------------------------------------
// Create Group Room
// -----------------------------------------------------------------------------
export const createGroupRoom = async ({
    roomName,
    createdBy
}) => {

     // 기본 검증
    if (!roomName || typeof roomName !== "string") {
        throw new Error("Room name is required.");
    }

    if (!createdBy) {
        throw new Error("Creator is required.");
    }


     // 1. Transaction 시작
    const result = await withTransaction(async (session) => {

        // 2. Room 생성
        const room = await roomRepository.createGroupRoom({
            roomName: roomName.trim(), //앞뒤 여백 삭제
            createdBy,
            session
        });

        // 3. Creator Membership 생성
        await roomMembershipRepository.createCreatorMembership({
            roomId: room._id, //db에서 받아와 db 저장에 그대로 사용 toString() 불필요
            createdBy,
            session
        });

        // 4. Transaction 내부에서 생성된 room을 반환
        return room;
    });

    // // 5. Transaction이 성공적으로 Commit된 후 Event 발생
    // eventBus.emit("room:created:group", {
    //     roomId: room._id.toString(),
    //     createdBy: createdBy.toString()
    // });

    // 6. Controller로 room 반환
    return result;
};


// -----------------------------------------------------------------------------
// 초대장을 발송
// -----------------------------------------------------------------------------
export const createPendingMemberships = async (
    roomId, 
    targetUserIds, 
    inviterId
) => {

    //** 방 존재 여부 검증
    const room = await roomRepository.findById(roomId);

    if (!room) {
        throw new Error("Room not found.")
    };

    // 현재 방의 Membership db에서 조회
    const memberships =
        await roomMembershipRepository.findByRoomId(roomId);



    //** 룸에 이미 참여중인 유저 리스트를 만들고 추가하려고 유저가 이미 있는지 검증*/
    //룸에 저장된 참여자 목록을 불러와 Set객체 타입으로 저장
    //Set객체 타입은 조회시 복잡도를 줄여서 성능을 극대화할 수 있다.
    //filter()와 some() 조합도 가능하지만 복잡도가 O(n²)로 증가
    const existingUserIds = new Set(

        // 현재 채팅방(room)에 있는 참여자 배열을 돌면서, 각 참여자의 userId를 꺼내와 배열로반환
        memberships.map(
            membership => membership.userId.toString() //db에서 받아와 몽고DB 오브젝트
        )
    );

    // 기존 멤버쉽과 교차 비교하여 아직 Membership이 없는 유저만 필터링
    // targetUserIds의 각 id를 existingUserIds 내부에 존재하는지 검증한다
    // 느낌표를 사용해 존재하면 true가 아닌 false를 반환해 존재하지 않는 id만 전달한다.
    const newUserIds = targetUserIds.filter(
        userId => !existingUserIds.has(userId)
    );

    if (newUserIds.length === 0) {
        throw new Error(
            "All users are already in this room."
        );
    }

    // Transaction
    const result = await withTransaction(async (session) => {

        const newMemberships = 
            await roomMembershipRepository.createPendingMemberships({
                roomId,
                targetUserIds: newUserIds,
                inviterId,
                session
            });
        
        await roomMembershipHistoryRepository.createMany({
            roomId,
            targetUserIds: newUserIds,
            actorId: inviterId,
            action: "invited",
            session
        });

        return {
            roomId: room._id,
            newMemberships
        }
    });


    // // 5. 이벤트 발행 (초대된 사람 기준)
    // eventBus.emit("room:invited", {
    //     roomId: result.roomId.toString(),
    //     invitedBy: inviterId.toString(),
    //     targetUserIds: newUserIds.map(
    //         id => id.toString()
    //     )
    // });

     // Controller로 반환
    return result
};



////*** 초대장을 거부 */
export const rejectInvitation = async (roomId, userId) => {
    const room = await Room.findOneAndUpdate(
        {
            _id: roomId,
            "participants.userId": userId,
            "participants.status": "pending" // 대기중인 초대일때만 거절 가능
        },
        {
            $set: {
                "participants.$.status" : "rejected"
            }
        },
        { new: true }
    );

    if (!room) {
        throw new Error("Pending invitation not found or already processed.");
    }
}


////*** 초대장을 수락 */
export const acceptInvitation = async (roomId, userId) => {

    const updatedRoom = await roomRepository.acceptInvitation(roomId, userId);

    if (!updatedRoom) {
        throw new Error(
            "Invitation not found or already processed."
        );
    }

    eventBus.emit("room:joined", {
        roomId,
        userId
    });

    return {
        roomId: updatedRoom._id.toString(),
        userId
    };
};

///*** 가입 요청을 db에 반영하는 함수 */
export const joinRoom = async (roomId, userId) => {
    // 방이 실제로 존재하는지 '먼저' 검증
    const room = await roomRepository.findById(roomId);
    if (!room) {
        throw new Error("ROOM_NOT_FOUND"); // 명확한 에러 코드 분리
    }

    // DB에 가입 처리 요청
    const updatedRoom = await roomRepository.joinRoom(roomId, userId);

    // 만약 결과가 null이라면 둘 중 하나입니다.
    //    - 방이 존재하지 않거나
    //    - 이미 이 방에 가입되어 있어서 ($ne 조건에 걸려) 업데이트가 무시되었거나
    if (!updatedRoom) {
        throw new Error("ALREADY_JOINED");
    }
    // 정상 가입 완료 시 이벤트 발행
    eventBus.emit("room:joined", {
        roomId: updatedRoom._id.toString(),
        userId: userId.toString(),
        roomType: updatedRoom.type
    });

    return updatedRoom;
};


//*** 유저가 룸을 떠날때 참여자를 DB에서 삭제하는 함수 */
export const leaveRoom = async(roomId, userId) => {

    const room = await roomRepository.findById(roomId);
    if (!room) throw new Error("ROOM_NOT_FOUND");

    //나가는 유저 찾기
    const leavingParticipants = room.participants.find(
        (p) => p.userId.toString() !== userId.toString()
    );

    if (!leavingParticipant) throw new Error("NOT_A_PARTICIPANT");

    //참여자 목록에서 유저 제거
    room.participants = room.participants.filter(
        (p) => p.userId.toString() !== userId.toString()
    );

    if (room.participants.length === 0 ) {
        await roomRepository.softDeleteRoom(roomId)
        
    }

    //만약 떠나는 사람이 방장일때 다음 방장을 지정
    if (room.admin.toString() === userId.toString()) {
        //다른 참가자가 있으면 가장 먼저 참가한 유저가 admin으로 지정됨
        if ( room.participants.length > 0 ) {
            const nextAdmin = room.participants.find( p => p.status === "accepted") || room.participants[0]
            room.admin = nextAdmin.userId;
        } else {
            //방에 참가하 유저가 없으면 방을 삭제
            await roomRepository.findByIdAndDelete(roomId);
            return { message: "Room removed as no participants left." };
        }
    }

    await roomRepository.save(room)

    return room;
};

//*** 룸을 deactivate 하는 함수*/
export const deleteRoom = async( roomId, adminId) => {
    const room = await roomRepository.findById(roomId);
     if (!room) throw new Error("Room not found");

     if (room.admin.toString() !== adminId.toString()) {
        throw new Error("Only the room creator can delete this room.")
     }

     if(!room.isActive) {
        throw new Error("This room is already deactivated.")
     }

     room.isActive= false
     await roomRepository.save(room)

    // 또는 findByIdAndUpdate 사용 시:
    // await Room.findByIdAndUpdate(roomId, { isActive: false });

    return { success: true, message: "Room has been deactivated, but data is preserved." };
}

export const getUserRooms = async (userId) => {
    try {
        const rooms = await roomRepository.findUserRooms(userId)
        
        return rooms

    } catch (error) {
        throw new Error("Error fetching user rooms: " + error.message);
    }
}

export const getDiscoverableRooms = async (userId) => {
    try {
        return await roomRepository.findDiscoverableRooms(userId)
    
    } catch (error) {
        throw new Error("Error fetching discoverable rooms: " + error.message);
    }
}
// //======================================================================================================
// import Room from "../models/Room.js";

// //*** 생성된 방을 DB에 저장하는 함수 */
// export const createRoom = async (roomName, participants, createdBy) => {

//     const invitedParticipants = participants.filter(
//         (userId) => userId.toString() !== createdBy.toString()
//     )

//     const newRoom = await Room.create({
//         roomName,
//         participants: [
//             ...invitedParticipants.map(userId => ({ userId, status: 'pending' })),
//             { userId: createdBy, status: 'accepted' }
//         ],
//         createdBy
//     });

//     return newRoom;
// }

// //*** 초대장을 발송 */
// export const inviteUsersToRoom = async (roomId, targetUserIds) => {

//     const room = await Room.findById(roomId);
//     if (!room) throw new Error("Room not found.");

//     //기존 paticipants에 없는 유저만 newParticipants에 할당
//     const newParticipants = targetUserIds.filter(userId => 
//         !room.participants.some(p => p.userId.toString() === userId)
//     );

//     //새로운 유저가 없으면 db에서 받은 room 정보와 빈 배열 반환
//     if (newParticipants.length === 0) {
//         return { room, newParticipants: []}
//     }

//     //participants에 새로운 유저 업데이트 이때 초대만 한 상태이기 때문에 status는 pending
//     const updatedRoom = await Room.findByIdAndUpdate(
//         roomId, 
//         { $push: { participants: {
//                 $each: newParticipants.map(userId => ({ userId, status: "pending"}))
//         }}},
//         {new: true}
//     );

//     return { room: updatedRoom, newParticipants };
// };

// //*** 가입 요청을 db에 반영하는 함수 */
// const _processRoomJoin = async (roomId, userId) => {
//     const room = await Room.findById(roomId);
//     if (!room) throw new Error("Room not found.")

//     //room 참여자 명단에 userId가 있는지 검증
//     const participant = room.participants.find(p => p.userId.toString() === userId)
//     if (participant) {
//         if(participant.status === 'accepted') throw new Error("Already joined the room.")
//         //명단에 있으면 status값을 accepted로 변경
//         participant.status = "accepted";
//     } else {
//         room.participants.push({ userId, status: 'accepted'})
//     }

//     await room.save()

//     return room
// }

// export const acceptInvitation = async (roomId, userId) => {
//     return await _processRoomJoin(roomId, userId);
// }

// export const joinRoom = async (roomId, userId) => {
//     return await _processRoomJoin(roomId, userId);
// }

// //*** 유저가 룸을 떠날때 참여자를 DB에서 삭제하는 함수 */
// export const leaveRoom = async(roomId, userId) => {
//     const room = await Room.findById(roomId);
//     if (!room) throw new Error("Room not found");

//     //참여자 목록에서 해당 유저 제거
//     room.participants = room.participants.filter(
//         (p) => p.userId.toString() !== userId.toString()
//     );

//     //만약 떠나는 사람이 방장일때 다음 방장을 지정
//     if (room.createdBy.toString() === userId.toString()) {
//         if ( room.participants.length > 0 ) {
//             const nextAdmin = room.participants.find( p => p.status === "accepted") || room.participants[0]
//             room.createdBy = nextAdmin.userId;
//         } else {
//             await Room.findByIdAndDelete(roomId);
//             return { message: "Room removed as no participants left." };
//         }
//     }

//     await room.save()

//     return room;
// };

// //*** 룸을 deactivate 하는 함수*/
// export const deleteRoom = async( roomId, adminId) => {
//     const room = await Room.findById(roomId);
//      if (!room) throw new Error("Room not found");

//      if (room.createdBy.toString() !== adminId.toString()) {
//         throw new Error("Only the room creator can delete this room.")
//      }

//      if(!room.isActive) {
//         throw new Error("This room is already deactivated.")
//      }

//      room.isActive= false
//      await room.save()

//     // 또는 findByIdAndUpdate 사용 시:
//     // await Room.findByIdAndUpdate(roomId, { isActive: false });

//     return { success: true, message: "Room has been deactivated, but data is preserved." };
// }

// export const getUserRooms = async (userId) => {
//     try {
//         const rooms = await Room.find({
//             "participants.userId": userId,
//             isActive: true
//         })
//         .populate({
//             path: "participants.userId", 
//             select: "fullName profilePic email"
//         })
//         .populate("createdBy", "fullName profilePic")
//         .sort({ updatedAt: -1 }) //최신순 정렬
        
//         return rooms

//     } catch (error) {
//         throw new Error("Error fetching user rooms: " + error.message);
//     }
// }

// export const getDiscoverableRooms = async (userId) => {
//     try {
//         return await Room.find({
//             //객체를 담은 배열은 "participants.userId"로 검색
//             "participants.userId": { $ne: userId },
//             isActive: true
//         })
//         .populate("createdBy", "fullName profilePic")
//         .sort({ createdAt: -1})
//     } catch (error) {
//         throw new Error("Error fetching discoverable rooms: " + error.message);
//     }
// }