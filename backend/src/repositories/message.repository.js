import Message from "../models/Message.js";

 //*** 특정 유저와 주고받은 메시지 내역 조회 
export const findMessagesBetweenUsers = async ( userId, user2Id) => {
    return await Message.find({
        $or: [
            { senderId:userId, receiverId: user2Id},
            { senderId: user2Id, receiverId: userId},
        ],
    }).sort({ createdAt: 1 })
}

 //*** 새로운 메시지 생성
export const create = async (messageData) => {
    return await Message.create(messageData);
}

//*** 유저가 참여한 모든 대화 목록 조회 (파트너 추출용)   
export const findUserMessages = async (userId) => {
    return await Message.find({
        $or: [{ senderId: userId }, { receiverId: userId }].
    })
}