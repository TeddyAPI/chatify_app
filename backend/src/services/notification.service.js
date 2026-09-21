// backend/src/services/notification.service.js
import Notification from "../models/Notification.js";
import eventBus from "../lib/eventBus.js";

//*** 1. 알림 생성 (시스템 내부 호출용)
// DB 저장과 실시간 소켓 핑을 동시에 처리합니다.
export const createNotification = async (data) => {
    try {
        const notification = await Notification.create(data);

        eventBus.emit("notification:created", {
            recipientId: notification.recipientId,
            type: notification.type
        });

        return notification;
    } catch (error) {
        console.error("[Notification Service] Creation failed:", error)
        throw error;
    }
};

//*** 2. 내 알림 목록 조회 (Controller 호출용)
// 최신순 정렬 및 관련 데이터(sender, room 등)를 채워서 반환합니다.
export const getUserNotification = async (userId) => {
    return await Notification.find({ recipientId: userId})
        .populate("senderId", "fullName profilePic") //보낸 사람 정보
        .populate({
            path:"relatedId",
            refPath: "relatedModel" //동 적 참조(Room 또는 Message)
        })
        .sort({ createdAt: -1 })
        .limit(50); // 최근 50개만 노출 (성능 고려)
}

//***  3. 개별 알림 읽음 처리
export const markAsRead = async(notificationId, userId) => {
    return await Notification.findOneAndUpdate(
        {
            _id: notificationId, 
            recipientId: userId 
        },
        { 
            isRead: true,
            // 읽은 시점으로부터 3일 뒤에 자동 삭제되도록 설정
            expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) 
        },
        { new: true}
    );
};

//***  4. 전체 알림 읽음 처리
export const markAllAsRead = async (userId) => {
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일 후 삭제

    return await Notification.updateMany(
        { recipientId: userId, isRead: false},
        { 
        $set: { 
          isRead: true,
          expiresAt: expiryDate
           } 
        }
    );
};

//***  5. 개별 알림 삭제 (물리 삭제)
export const deleteNotification = async (userId) => {
    return await Notification.findOneAndDelete({ 
        recipientId: userId
    });
};

//***  6. 모든 알림 삭제 (알림함 비우기)
export const deleteAllNotifications = async (userId) => {
    return await Notification.deleteMany({ 
        _id: notificationId,
        recipientId: userId
    });
};

//***  7. 안 읽은 알림 개수 조회 (배지용)
export const deleteAllNotifications = async (userId) => {
    return await Notification.countDocuments({ 
        recipientId: userId,
        isRead: false
    });
};