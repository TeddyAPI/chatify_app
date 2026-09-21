import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

//** db에서 나 자신을 제외한 모든 유저를 반환하는 함수
export const getAllContacts = async(req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

        res.status(200).json(filteredUsers)
    } catch(error) {
        console.log("Error in getAllContacts:", error);
        res.status(500).json({ message: "Server error" });
    }
};

//** 내가 보냈거나 받은 모든 메세지를 반환하는 함수 */
export const getMessagesByUserId = async(req, res) => {
    try {
        //로그인된 userId
        const myId = req.user._id;

        //URL로 부터 메세지를 송수신할 상대방 userToChatId를 받아 생성
        const { id: userToChatId } = req.params

        //$or을 사용해 입력된 2조건에 하나라도 맞는 것을 조회한다.
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ],
        });

        res.status(200).json(messages);

    } catch(error) {
        console.log("Error in getMessages controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

//** req.body에서 메새지 내용 및 이미지를 DB에 저장 후 상대에게 전송하는 함수*/
export const sendMessage = async(req, res) => {
    try {
        //contents
        const {text, image} = req.body;
        //메세지를 수신할 유저ID
        const { id: receiverId } = req.params;
        //메세지를 보내는 유저ID(로그인된 유저)
        const senderId = req.user._id;

         if (!text && !image) {
            return res.status(400).json({ message: "Text or image is required." });
        }
        if (senderId.equals(receiverId)) {
            return res.status(400).json({ message: "Cannot send messages to yourself." });
        }
        const receiverExists = await User.exists({ _id: receiverId});
            if (!receiverExists) {
            return res.status(404).json({ message: "Receiver not found." });
        }

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url
        }

        //DB 저장을 위한 Message 모델 객체 생성
        const newMessage =  new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        //db에 저장
        await newMessage.save();

        //소켓 통신으로 메세지를 보내기위해 받는 사람의 socketId를 얻어오기 위해 getReceiverSocketId()함수 실행
        const receiverSocketId = getReceiverSocketId(receiverId)
        if (receiverSocketId) {
            //특정(receiverSocketId) 유저에게 메세지 전송
            io.to(receiverSocketId).emit("newMessage", newMessage)
        }

        res.status(201).json(newMessage);

    } catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

//** 나와 채팅한 상대방 정보를 얻는 함수
export const getChatPartners = async ( req, res ) => {
    try {
        //req에서 로그인된 유저 id를 얻는다.
        const loggedInUserId = req.user._id;

        //정의된 두 조건 중 하나라도 만족하는 data 반환
        //내가 보냈거나 받은 메세지 모두 반환
        const messages = await Message.find({
            $or: [{senderId: loggedInUserId}, {receiverId: loggedInUserId}],
        });

        //“이 메시지에서 나를 제외한 상대방 ID”를 뽑을때 사용
        //두 아이디가(loggedInUserId, senderId) 같으면 상대가 receiver이기 때문에 receiverId를 반환하고 반대이면 내가 receiver에 해당해서 senderId를 반환한다.
        //new Set()은 중복되는 data를 제거한다. 제거 된 data는 iterable이라 내부 data를 ...로 한개씩 꺼내 배열로 재 입력한다.
        const chatPartnerIds = [
            ...new Set(
                messages.map((msg) =>
                msg.senderId.toString() === loggedInUserId.toString()
                    ? msg.receiverId.toString()
                    : msg.senderId.toString()
                )
            )
        ];

        // 나 자신과 채팅한 유저의 id를 이용해 해당 유저의 정보를 반환 받는다.
        const chatPartners = await User.find({ _id: {$in:chatPartnerIds} }).select("-password")

        res.status(200).json(chatPartners)

    } catch (error) {
        console.error("Error in getChatPartners: ", error.message);
        res.status(500).json({ error: "Internal server error" });
  }
}