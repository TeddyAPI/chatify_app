import * as messageService from "../services/message.service.js"; // 서비스 임포트
import { getReceiverSocketId, io } from "../lib/old.socket.js";
import * as userRepository from "../repositories/user.repository.js";  

// ** DB에서 나 자신을 제외한 모든 유저를 반환 (Service 활용)
export const getAllContacts = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;

        // 서비스 호출
        const filteredUsers = await messageService.getAllContacts(loggedInUserId);

        res.status(200).json(filteredUsers);

    } catch (error) {
        console.log("Error in getAllContacts:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ** 내가 보냈거나 받은 모든 메세지를 반환
export const getMessagesByUserId = async (req, res) => {
    try {
        const myId = req.user._id;

        const { id: userToChatId } = req.params;
        console.log("userToChatId", userToChatId)

        // 서비스 호출
        const messages = await messageService.getMessagesByUserId(myId, userToChatId);

        res.status(200).json(messages);

    } catch (error) {
        console.log("Error in getMessagesByUserId controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ** 메시지 전송 (Service 활용 및 소켓 통신)
export const sendMessage = async (req, res) => {
    try {
        const { text, image, roomId } = req.body;

        const { id: receiverId } = req.params;

        const senderId = req.user._id;

        // 1. 유효성 검사 (컨트롤러의 역할)
        if (!text && !image) {
            return res.status(400).json({ message: "Text or image is required." });
        }

        //아래의 서비스 호출시 내부에서 receiverExists 체크가 일어남 그래서 삭제
        // if (senderId.equals(receiverId)) {
        //     return res.status(400).json({ message: "Cannot send messages to yourself." });
        // }
        
        // const receiverExists = await userRepository.exists(receiverId);
        // if (!receiverExists) {
        //     return res.status(404).json({ message: "Receiver not found." });
        // }

        // 2. 서비스 호출 (이미지 업로드, DB 저장, 캐시 삭제 로직 포함)
        const newMessage = await messageService.sendMessage({
            senderId,
            receiverId,
            roomId,
            text,
            image
        });


        res.status(201).json(newMessage);
        
    } catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ** 나와 채팅한 상대방 정보를 얻는 함수 (Service 활용)
export const getChatPartners = async (req, res) => {
    try {
        
        const loggedInUserId = req.user._id;
        console.log("loggedInUserId", loggedInUserId)

        // 서비스 호출
        const chatPartners = await messageService.getChatPartners(loggedInUserId);

        res.status(200).json(chatPartners);
    } catch (error) {
        console.error("Error in getChatPartners: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};