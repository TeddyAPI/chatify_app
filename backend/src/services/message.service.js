import * as messageRepository from "../repositories/message.repository.js";                                                       │
import * as userRepository from "../repositories/user.repository.js";                                                             │
import * as cacheRepository from "../repositories/cache.repository.js";
import cloudinary from "../lib/cloudinary.js";
import eventBus from "../lib/eventBus.js";
import * as roomService from "./room.service.js";
import * as notificationService from "./notification.service.js";
import { isUserOnline } from "../lib/socket.js";


const TTL = 10 * 60 * 1000;

//**메시지 전송 및 관련 캐시 무효화
export const sendMessage = async ({ senderId, receiverId, roomId, text, image }) => {
    let targetRoomId = roomId;

    /// 1. [방 확보 로직] roomId가 없다면 1:1 방을 찾거나 생성
    if(!targetRoomId && receiverId) {
        const room = await roomService.findOrCreateDirectRoom(senderId, receiverId);
        targetRoomId = room._id
    }

    if (!targetRoomId) {
        throw new Error("Target Room or Receiver is required.");
    }

    // 2. 이미지 처리 (기존 로직 유지)
    let imageUrl = "";
    //메세지에 전달된 이미지가 있으면 cloudinary로 업데이트 후 url 반환 
    if (image) {
        const uploadResponse = await cloudinary.uploader.upload(image);
        imageUrl = uploadResponse.secure_url;
    }

    // 3. 메시지 저장 (receiverId는 1:1일 때만 저장)
    const newMessage = await messageRepository.create({
        senderId,
        receiverId: targetReceiverId || null, // 그룹채팅이면 null, 1:1이면 ID 저장
        roomId: targetRoomId,
        text,
        image: imageUrl,
        type: image ? "image" : "text"
    });

    // 4. [중요] 알림(Notification) 생성 로직
    if (receiverId) {
        // 1:1 채팅인 경우: 상대방이 오프라인이면 알림 생성
        if(!isUserOnline(targetReceiverId)) {
            await notificationService.createNotification({
                await notificationService.createNotification({
                    recipientId: targetReceiverId,
                    senderId,
                    type: "message_mention",
                    content: "새 메시지가 도착했습니다.",
                    relatedId: targetRoomId,
                    relatedModel: "Room"
                })
            })
        }
    } else {
        // 그룹 채팅인 경우: 나를 제외한 모든 '오프라인' 멤버에게 알림 생성
        const room = await roomService.getRoomById(targetRoomId)
        const offlineMembers = room.participants
            .filter(p=>p.userId.toString() !== senderId.toString() && !isUserOnline(p.userId))

            // 오프라인 멤버들에게 각각 Notification 생성 (Batch 처리 가능)     
            await notificationService.createBulkNotifications(offlineMembers,...)
    }

    //2. 저장된 캐쉬에 저장된 data 초기화
    try {
        await cacheRepository.deleteCaches({
        key: { $in: [`chat_partners_${senderId}`, `chat_partners_${receiverId}`] }
        });
    } catch (cacheError) {
        console.error("Cache invalidation failed in sendMessage:", cacheError);
    }

    /**
        * 이벤트 발행 (Socket Publisher를 깨우는 역할)
        * - 직접 소켓을 쏘지 않고 "메시지가 성공적으로 보내졌다"는 사실만 알림
        * - message.publisher.js가 이 이벤트를 듣고 실제 소켓 전송을 담당함
        */
    eventBus.emit("message:sent", { receiverId, newMessage });

    return newMessage;
}

//**전체 연락처 조회 (캐시 적용)
export const getAllContacts = async (loggedInUserId) => {

    //1. 캐쉬키 생성 
    const cacheKey = `all_contacts_${loggedInUserId}`

    //2. 캐쉬 저장소 조회
    const cached = await cacheRepository.findOne(cacheKey);
    if (cached) return cached.value;

    //3. 없으면 DB에서 조회
    const users = await userRepository.findOtherUsers(loggedInUserId);

    //4. DB에서 조회한 값을 재사용하기 위해 캐쉬에 저장
    await cacheRepository.findOneAndUpdate(
        { key: cacheKey },
        { value: users, expiresAt: new Date(Date.now() + TTL) },
        { upsert: true}
    );
    // 5. DB에서 조회한 data 반환
    return users;
};

//**메시지 내역 조회(캐쉬 미사용)
export const getMessagesByUserId = async (myId, userToChatId) => {
    // 캐시 로직 없이 항상 DB에서 최신 데이터를 가져온다.
    return await messageRepository.findMessagesBetweenUsers(myId, userToChatId);
};



//**대화 파트너 목록 조회 (캐시 적용)
export const getChatPartners = async (loggedInUserId) => {

    //1. 캐쉬키 생성 
    const cacheKey = `chat_partners_${loggedInUserId}`

    //2. 캐쉬 저장소 조회
    const cached = await cacheRepository.findOne({ key: cacheKey });
    if (cached) return cached.value;

    //3. 없으면 DB에서 조회
    const messages = await messageRepository.findUserMessages(userId);

    //채팅을 나눈 상대의 ID만 추출 후 배열로 반환
    //두 아이디가(loggedInUserId, senderId) 같으면 상대가 receiver이기 때문에 receiverId를 반환하고 반대이면 내가 receiver에 해당해서 senderId를 반환한다.
    //new Set()은 중복되는 data를 제거한다. 제거 된 data는 iterable이라 내부 data를 ...로 한개씩 꺼내 배열로 재 입력한다.
    const chatPartnerIds = [... new Set(
        messages.map((msg) => 
            msg.senderId.toString() === loggedInUserId.toString()
            ? msg.receiverId.toString()
            : msg.senderId.toString()
        )
    )];
    console.log("chatPartnerIds", chatPartnerIds)

    //chatPartnerIds에 해당하는 유저 정보를 DB에 조회
    const chatPartners = await userRepository.findByIds(chatPartnerIds)

    // 4. DB에서 조회한 값을 재사용하기 위해 캐쉬에 저장
    await cacheRepository.findOneAndUpdate(
        { key: cacheKey },
        { value: chatPartners, expiresAt: new Date(Date.now() + TTL) },
    );

    //5. DB에서 조회한 data 반환
    return chatPartners
}

// import * as messageRepository from "../repositories/message.repository.js";                                                       │
// import * as userRepository from "../repositories/user.repository.js";                                                             │
// import * as cacheRepository from "../repositories/cache.repository.js";
// import cloudinary from "../lib/cloudinary.js";

// const TTL = 10 * 60 * 1000;

// //**전체 연락처 조회 (캐시 적용)
// export const getAllContacts = async (loggedInUserId) => {

//     //1. 캐쉬키 생성 
//     const cacheKey = `all_contacts_${loggedInUserId}`

//     //2. 캐쉬 저장소 조회
//     const cached = await Cache.findOne({ key: cacheKey });
//     if (cached) return cached.value;

//     //3. 없으면 DB에서 조회
//     const users = await User.find({_id: { $ne:loggedInUserId} }).select("-password");

//     //4. DB에서 조회한 값을 재사용하기 위해 캐쉬에 저장
//     await Cache.findOneAndUpdate(
//         { key: cacheKey },
//         { value: users, expiresAt: new Date(Date.now() + TTL) },
//         { upsert: true}
//     );
//     // 5. DB에서 조회한 data 반환
//     return users;
// };

// //**메시지 내역 조회(캐쉬 미사용)
// export const getMessagesByUserId = async (myId, userToChatId) => {
//     // 캐시 로직 없이 항상 DB에서 최신 데이터를 가져온다.
//     return await Message.find({
//         $or: [
//             { senderId: myId, receiverId: userToChatId},
//             { senderId: userToChatId, receiverId: myId},
//         ],
//     });
// };

// //**메시지 전송 및 관련 캐시 무효화
// export const sendMessage = async ({ senderId, receiverId, text, image }) => {
//     let imageUrl;
//     if (image) {
//         const uploadResponse = await cloudinary.uploader.upload(image);
//         imageUrl = uploadResponse.secure_url;
//     }

//     const newMessage = new Message({
//         senderId, receiverId, text, image: imageUrl
//     });

//     //1.  새로운 메세지 DB에 저장
//     await newMessage.save()

//     //2. 저장된 캐쉬에 저장된 data 초기화
//     await Cache.deleteMany({
//         key: { $in: [`chat_partners_${senderId}`, `chat_partners_${receiverId}`]}
//     })

//     return newMessage;
// }

// //**대화 파트너 목록 조회 (캐시 적용)
// export const getChatPartners = async (loggedInUserId) => {

//     //1. 캐쉬키 생성 
//     const cacheKey = `chat_partners_${loggedInUserId}`

//     //2. 캐쉬 저장소 조회
//     const cached = await Cache.findOne({ key: cacheKey });
//     if (cached) return cached.value;

//     //3. 없으면 DB에서 조회
//     const messages = await Message.find({
//         $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
//     });

//     //채팅을 나눈 상대의 ID만 추출 후 배열로 반환
//     //두 아이디가(loggedInUserId, senderId) 같으면 상대가 receiver이기 때문에 receiverId를 반환하고 반대이면 내가 receiver에 해당해서 senderId를 반환한다.
//     //new Set()은 중복되는 data를 제거한다. 제거 된 data는 iterable이라 내부 data를 ...로 한개씩 꺼내 배열로 재 입력한다.
//     const chatPartnerIds = [... new Set(
//         messages.map((msg) => 
//             msg.senderId.toString() === loggedInUserId.toString()
//             ? msg.receiverId.toString()
//             : msg.senderId.toString()
//         )
//     )];
//     console.log("chatPartnerIds", chatPartnerIds)

//     //chatPartnerIds에 해당하는 유저 정보를 DB에 조회
//     const chatPartners = await User.find({ _id: { $in: chatPartnerIds}}).select('-paswword');

//     // 4. DB에서 조회한 값을 재사용하기 위해 캐쉬에 저장
//     await Cache.findOneAndUpdate(
//         { key: cacheKey },
//         { value: chatPartners, expiresAt: new Date(Date.now() + TTL) },
//         { upsert: true}
//     );

//     //5. DB에서 조회한 data 반환
//     return chatPartners
// }