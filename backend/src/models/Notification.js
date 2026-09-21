import mongoose from "mongoose"; const notificationSchema = new mongoose.Schema(     
    {         
        // 1. 수신자 (누구의 알림함에 보일 것인가)     
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true // 유저별 알림 조회를 위해 인덱스 추가
        },

         // 2. 알림 발생자 (시스템 알림일 경우 null 허용)
        senderId: {
             type: mongoose.Schema.Types.ObjectId,
             ref: "User",
             required: false
        },

         // 3. 알림 타입
        type: {
             type: String,
             enum: ["room_invitation", "message_mention", "notice"],
             required: true
        },

         // 4. 알림 메시지 내용
        content: {
             type: String,
             required: true,
             trim: true
        },

         // 5. 관련 데이터 ID (예: 초대된 방의 ID, 언급된 메시지의 ID 등)
        relatedId: {
             type: mongoose.Schema.Types.ObjectId,
             required: false,
             refPath: 'relatedModel'
        },

         // 6. 관련 데이터의 모델 (Mongoose의 dynamic ref 활용 가능)
        relatedModel: {
             type: String,
             enum: ["Room", "Message", "User","Notice"],
             required: false
        },

         // 7. 읽음 상태
        isRead: {
             type: Boolean,
             default: false,
             index: true
        },

        // 8. 자동 삭제를 위한 필드 추가
        expiresAt: {
            type: Date,
               required: false,
               index: { expires: 0 } // 필드 값에 도달하면 자동 삭제
        },
     },
     { timestamps: true }
 );

 // 특정 유저의 '읽지 않은 알림' 최신순 조회를 위한 복합 인덱스
 notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

 const Notification = mongoose.model("Notification", notificationSchema);

 export default Notification;